import { aztec } from "@shieldswap/vite-plugin-aztec";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit(), aztec()],
});
