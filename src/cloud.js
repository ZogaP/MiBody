import { createClient } from "@supabase/supabase-js";
import { initial, validateBackup } from "./core.js";
import { readCloudCache, updateCloudCache } from "./db.js";
import publicConfig from "./cloud-config.json" with { type: "json" };

let client,
  user = null,
  status = "Somente neste aparelho",
  conflict = null;
let generation = 0,
  syncing = null,
  callbacks = {},
  authSubscription;
const configKey = "mibody-cloud-config";
export function validateCloudConfig(url, key) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw Error("Informe a URL HTTPS do projeto Supabase.");
  }
  if (
    parsed.protocol !== "https:" ||
    !/^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname) ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    !["", "/"].includes(parsed.pathname) ||
    parsed.search ||
    parsed.hash
  )
    throw Error("Use a URL do projeto, como https://seu-projeto.supabase.co.");
  if (key.startsWith("sb_secret_") || /service_role/.test(key))
    throw Error(
      "Use somente a chave pública publishable/anon, nunca service_role.",
    );
  if (!key.startsWith("sb_publishable_")) {
    try {
      const payload = JSON.parse(
        atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (payload.role !== "anon") throw Error();
    } catch {
      throw Error("A chave precisa ser pública: publishable ou anon.");
    }
  }
  if (key.length < 30) throw Error("Confira a chave pública completa.");
  return { url: parsed.origin, key };
}
export function cloudConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(configKey) || "null");
    const url =
      saved?.url || import.meta.env.VITE_SUPABASE_URL || publicConfig.url;
    const key =
      saved?.key || import.meta.env.VITE_SUPABASE_ANON_KEY || publicConfig.key;
    return url && key ? validateCloudConfig(url, key) : null;
  } catch {
    return null;
  }
}
export function saveCloudConfig(url, key) {
  if (user) throw Error("Saia da conta antes de alterar a conexão.");
  localStorage.setItem(
    configKey,
    JSON.stringify(validateCloudConfig(url, key)),
  );
}
export const cloudInfo = () => ({
  configured: !!client,
  user,
  status,
  conflict: !!conflict,
});
function report(message) {
  status = message;
  callbacks.status?.();
}
export async function initializeCloud(handlers) {
  callbacks = handlers;
  const config = cloudConfig();
  if (!config) return;
  client = createClient(config.url, config.key, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  const { data, error } = await client.auth.getSession();
  if (error) report("Não foi possível recuperar a sessão. Entre novamente.");
  user = data?.session?.user || null;
  if (user) await callbacks.account(user);
  authSubscription?.unsubscribe();
  authSubscription = client.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      setTimeout(() => callbacks.recovery?.(), 0);
      return;
    }
    const next = session?.user || null;
    if (next?.id === user?.id) return;
    generation++;
    user = next;
    conflict = null;
    setTimeout(() => callbacks.account(next), 0);
  }).data.subscription;
}
function requireClient() {
  if (!client) throw Error("Conecte primeiro o projeto Supabase.");
  if (location.protocol === "file:")
    throw Error("Use a versão hospedada em HTTPS para entrar na conta.");
  return client;
}
function authError(error) {
  if (!error) return;
  if (/Invalid login credentials/i.test(error.message))
    throw Error("E-mail ou senha incorretos.");
  if (/Email not confirmed/i.test(error.message))
    throw Error("Confirme seu e-mail antes de entrar.");
  if (/rate|too many/i.test(error.message))
    throw Error("Muitas tentativas. Aguarde alguns minutos.");
  throw Error(
    "Não foi possível concluir o acesso. Confira a conexão e as configurações do projeto.",
  );
}
export async function signIn(email, password) {
  const { error } = await requireClient().auth.signInWithPassword({
    email,
    password,
  });
  authError(error);
}
export async function signUp(email, password, name) {
  const { data, error } = await requireClient().auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: location.origin + import.meta.env.BASE_URL,
    },
  });
  authError(error);
  return !!data.session;
}
export async function signOut() {
  const { error } = await requireClient().auth.signOut({ scope: "local" });
  authError(error);
}
export async function resetPassword(email) {
  const { error } = await requireClient().auth.resetPasswordForEmail(email, {
    redirectTo: location.origin + import.meta.env.BASE_URL,
  });
  authError(error);
}
export async function changePassword(password) {
  const { error } = await requireClient().auth.updateUser({ password });
  authError(error);
}
async function remoteState(id) {
  const { data, error } = await client
    .from("user_state")
    .select("data,revision")
    .eq("user_id", id)
    .maybeSingle();
  if (error) throw error;
  if (data) validateBackup(data.data);
  return data;
}
function blankAccountState() {
  const state = initial();
  const name = user?.user_metadata?.display_name;
  if (typeof name === "string") state.profile.name = name.slice(0, 100);
  return state;
}
export async function loadAccount(id) {
  const epoch = generation;
  const local = await readCloudCache(id);
  try {
    const remote = await remoteState(id);
    if (epoch !== generation || user?.id !== id) return null;
    if (local?.dirty) {
      if ((remote?.revision || 0) !== local.revision) {
        conflict = { id, remote };
        report("Conflito entre aparelhos. Escolha qual versão manter.");
      } else report("Alterações locais aguardando sincronização");
      return validateBackup(local.state);
    }
    if (remote) {
      await updateCloudCache(id, () => ({
        state: remote.data,
        revision: remote.revision,
        dirty: false,
      }));
      report("Sincronizado com sua conta");
      return remote.data;
    }
    report("Conta conectada. Seus registros serão sincronizados.");
    return blankAccountState();
  } catch {
    if (epoch !== generation || user?.id !== id) return null;
    report("Sem conexão com a nuvem. Dados locais preservados.");
    return local ? validateBackup(local.state) : blankAccountState();
  }
}
export async function synchronize() {
  if (!client || !user || conflict) return;
  if (syncing) return syncing;
  const id = user.id,
    epoch = generation;
  let more = false;
  syncing = (async () => {
    try {
      const local = await readCloudCache(id);
      if (epoch !== generation || user?.id !== id) return;
      if (!local?.dirty) {
        const { data, error } = await client
          .from("user_state")
          .select("revision")
          .eq("user_id", id)
          .maybeSingle();
        if (error) throw error;
        if (data && data.revision !== local?.revision) {
          const remote = await remoteState(id);
          if (epoch !== generation || user?.id !== id) return;
          let applied = false;
          await updateCloudCache(id, (current) => {
            if (current?.dirty) return current;
            applied = true;
            return {
              state: remote.data,
              revision: remote.revision,
              dirty: false,
            };
          });
          if (applied) callbacks.remote?.(remote.data);
        }
        report("Sincronizado com sua conta");
        return;
      }
      report("Sincronizando…");
      const { data, error } = await client.rpc("save_user_state", {
        expected_revision: local.revision || 0,
        payload: local.state,
      });
      if (epoch !== generation || user?.id !== id) return;
      if (error) {
        if (error.code === "40001") {
          const remote = await remoteState(id);
          if (epoch !== generation || user?.id !== id) return;
          if (
            remote &&
            JSON.stringify(remote.data) === JSON.stringify(local.state)
          ) {
            const after = await updateCloudCache(id, (current) => ({
              ...current,
              revision: remote.revision,
              dirty: current.changeId !== local.changeId,
            }));
            more = after.dirty;
            report("Sincronizado com sua conta");
            return;
          }
          conflict = { id, remote };
          report("Conflito entre aparelhos. Escolha qual versão manter.");
          return;
        }
        throw error;
      }
      const saved = Array.isArray(data) ? data[0] : data;
      if (!saved?.revision) throw Error("Resposta inválida da sincronização");
      const after = await updateCloudCache(id, (current) => ({
        ...current,
        revision: saved.revision,
        dirty: current.changeId !== local.changeId,
      }));
      more = after.dirty;
      report(
        after.dirty
          ? "Alterações locais aguardando sincronização"
          : "Sincronizado com sua conta",
      );
    } catch {
      if (epoch === generation && user?.id === id)
        report(
          "Não sincronizado. Registros salvos neste aparelho; tente novamente.",
        );
    }
  })().finally(() => {
    syncing = null;
    if (more && epoch === generation && user?.id === id)
      setTimeout(() => synchronize(), 0);
  });
  return syncing;
}
export async function resolveConflict(useLocal) {
  if (!conflict || conflict.id !== user?.id) return;
  const { id, remote } = conflict;
  await updateCloudCache(id, (current) =>
    useLocal
      ? { ...current, revision: remote?.revision || 0, dirty: true }
      : {
          state: remote?.data || initial(),
          revision: remote?.revision || 0,
          dirty: false,
        },
  );
  conflict = null;
  if (!useLocal) callbacks.remote?.(remote?.data || initial());
  await synchronize();
}
export function accountPending() {
  return user
    ? readCloudCache(user.id).then((c) => !!c?.dirty)
    : Promise.resolve(false);
}
