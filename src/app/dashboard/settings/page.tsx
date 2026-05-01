"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/dashboard/TopBar";
import { Key, Plus, Trash2, Copy, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string;
  lastUsed: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPerms, setNewKeyPerms] = useState("read");
  const [creating, setCreating] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");

  const fetchData = useCallback(async () => {
    const [userRes, keysRes] = await Promise.all([
      fetch("/api/user"),
      fetch("/api/apikeys"),
    ]);
    if (userRes.ok) {
      const u = (await userRes.json()).user;
      setUser(u);
      setProfileName(u?.name ?? "");
    }
    if (keysRes.ok) setApiKeys((await keysRes.json()).keys);
    setLoading(false);
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg("");
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profileName }),
    });
    setProfileMsg(res.ok ? "Saved!" : "Failed to save.");
    if (res.ok) setUser((u) => u ? { ...u, name: profileName } : u);
    setSavingProfile(false);
    setTimeout(() => setProfileMsg(""), 3000);
  };

  const handleUpdatePassword = async () => {
    if (!newPwd) return;
    setSavingPwd(true);
    setPwdMsg("");
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    });
    const data = await res.json();
    setPwdMsg(res.ok ? "Password updated!" : (data.error ?? "Failed to update."));
    if (res.ok) { setCurrentPwd(""); setNewPwd(""); }
    setSavingPwd(false);
    setTimeout(() => setPwdMsg(""), 4000);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreateKey = async () => {
    if (!newKeyName) return;
    setCreating(true);
    const res = await fetch("/api/apikeys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName, permissions: newKeyPerms }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewKeySecret(data.apiKey.key);
      await fetchData();
      setNewKeyName("");
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Revoke this API key?")) return;
    const res = await fetch("/api/apikeys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to revoke API key.");
      return;
    }
    await fetchData();
  };

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Settings" subtitle="Account and API configuration" />

      <main className="flex-1 p-6 space-y-6 max-w-3xl">
        {/* Profile */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Profile</h2>
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 bg-[#0d2040] rounded animate-pulse w-48" />
              <div className="h-4 bg-[#0d2040] rounded animate-pulse w-64" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#6b88b0] mb-1">Full Name</label>
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-[#6b88b0] mb-1">Email</label>
                  <input type="email" defaultValue={user?.email ?? ""} disabled className="opacity-50 cursor-not-allowed" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" variant="secondary" loading={savingProfile} onClick={handleSaveProfile}>
                  Save Changes
                </Button>
                {profileMsg && (
                  <span className={`text-xs ${profileMsg === "Saved!" ? "text-emerald-400" : "text-red-400"}`}>
                    {profileMsg}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* API Keys */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">API Keys</h2>
              <p className="text-xs text-[#6b88b0] mt-0.5">Use these keys to authenticate with the Volt API</p>
            </div>
          </div>

          {/* New key secret display */}
          {newKeySecret && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
              <p className="text-xs text-emerald-400 font-semibold mb-2">New API key created — copy it now, it won&apos;t be shown again</p>
              <div className="flex items-center gap-2 bg-[#020c1b] border border-[#0d2040] rounded-lg p-2.5">
                <code className="text-xs font-mono text-white flex-1 break-all">{newKeySecret}</code>
                <button onClick={() => handleCopy(newKeySecret, "secret")} className="text-[#6b88b0] hover:text-white ml-2 flex-shrink-0">
                  {copied === "secret" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <button onClick={() => setNewKeySecret(null)} className="text-xs text-[#6b88b0] mt-2 hover:text-white">Dismiss</button>
            </div>
          )}

          {/* Create key form */}
          <div className="bg-[#020c1b] border border-[#0d2040] rounded-xl p-4 mb-4">
            <h3 className="text-xs font-medium text-white mb-3">Create New Key</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Key name (e.g. Production)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1"
              />
              <select value={newKeyPerms} onChange={(e) => setNewKeyPerms(e.target.value)} className="sm:w-36">
                <option value="read">Read only</option>
                <option value="read,write">Read + Write</option>
                <option value="full">Full access</option>
              </select>
              <Button size="sm" loading={creating} onClick={handleCreateKey} disabled={!newKeyName}>
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </div>
          </div>

          {/* Keys list */}
          <div className="space-y-2">
            {apiKeys.length === 0 ? (
              <div className="text-center py-6">
                <Key className="w-8 h-8 text-[#0d2040] mx-auto mb-2" />
                <p className="text-sm text-[#6b88b0]">No API keys yet</p>
              </div>
            ) : (
              apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between bg-[#020c1b] border border-[#0d2040] rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">{k.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-xs font-mono text-[#6b88b0]">
                          {revealed === k.id ? k.key : k.key.slice(0, 16) + "••••••••••••"}
                        </code>
                        <button onClick={() => setRevealed(revealed === k.id ? null : k.id)} className="text-[#6b88b0] hover:text-white">
                          {revealed === k.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="text-xs text-[#6b88b0] mt-0.5">
                        {k.permissions} · Created {formatDate(k.createdAt)}
                        {k.lastUsed && <> · Last used {formatDate(k.lastUsed)}</>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(k.key, k.id)}
                      className="p-1.5 text-[#6b88b0] hover:text-white rounded hover:bg-[#0d2040] transition-colors"
                    >
                      {copied === k.id ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(k.id)}
                      className="p-1.5 text-[#6b88b0] hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Security</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#6b88b0] mb-1">Current Password</label>
              <input type="password" placeholder="••••••••" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[#6b88b0] mb-1">New Password</label>
              <input type="password" placeholder="••••••••" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="secondary" loading={savingPwd} onClick={handleUpdatePassword} disabled={!currentPwd || !newPwd}>
                Update Password
              </Button>
              {pwdMsg && (
                <span className={`text-xs ${pwdMsg === "Password updated!" ? "text-emerald-400" : "text-red-400"}`}>
                  {pwdMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
