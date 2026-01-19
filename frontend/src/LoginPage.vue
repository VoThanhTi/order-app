<template>
  <div class="login-screen">
    <div class="login-card">
      <h2>Inloggen</h2>
      <p>Alleen admin/owner kan inloggen.</p>

      <form @submit.prevent="login">
        <label>
          Email
          <input v-model="email" type="email" autocomplete="email" required />
        </label>

        <label>
          Wachtwoord
          <input v-model="password" type="password" autocomplete="current-password" required />
        </label>

        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? "Bezig..." : "Login" }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "./lib/supabase";

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);

async function login() {
  error.value = null;
  loading.value = true;

  try {
    const { error: e } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (e) throw e;
  } catch (e: any) {
    error.value = e?.message ?? "Login mislukt";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #020617;
  color: #f9fafb;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #0b1220;
  border: 1px solid #111827;
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

h2 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
}

p {
  margin: 0 0 1rem;
  color: #cbd5e1;
  font-size: 0.9rem;
}

form {
  display: grid;
  gap: 0.75rem;
}

label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #e5e7eb;
}

input {
  height: 40px;
  border-radius: 10px;
  border: 1px solid #1f2937;
  background: #020617;
  color: #f9fafb;
  padding: 0 0.75rem;
  outline: none;
}

input:focus {
  border-color: #2563eb;
}

.btn {
  height: 42px;
  border: none;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn:hover:enabled {
  background: #1d4ed8;
}

.error {
  margin: 0.25rem 0 0;
  color: #fca5a5;
  font-size: 0.85rem;
}
</style>