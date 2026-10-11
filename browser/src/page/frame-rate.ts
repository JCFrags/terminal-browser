export function frameRate(fullRate = true) {
  const configured = Number(process.env.TERMINAL_BROWSER_FPS);
  const normal = Number.isFinite(configured) && configured > 0
    ? Math.max(1, Math.min(240, Math.round(configured)))
    : 60;
  return fullRate ? normal : Math.min(normal, 4);
}
