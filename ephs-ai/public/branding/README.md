# Branding assets

Drop the **official EPHS AI logo** here as `ephs-ai-logo.png` (or `.svg`).

Rules (from the project branding policy):

- Use the exact supplied asset - do not redraw, recolor, stretch, or replace it.
- Preserve the native aspect ratio.
- Never substitute a generated logo.

The official asset is present as `ephs-ai-logo.png` and is rendered through
`next/image` by the shared `components/EPHSLogo.tsx`. That component is the
single replacement point for the logo; it uses the asset exactly as supplied
(no crop, stretch, recolor, or redraw) and preserves its native aspect ratio.
