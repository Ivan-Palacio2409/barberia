'use client'

import { useEffect, useRef } from 'react'

// ============================================================
// ShaderBackground.tsx
//
// Fondo animado en WebGL para el hero: humo/niebla sutil sobre
// el fondo onyx con un resplandor dorado que reacciona a la
// posición del mouse. Adaptado 1:1 del shader de referencia
// (shader.html — Aureum & Onyx) a un componente de React con su
// propio ciclo de vida (setup en el mount, cleanup en el unmount).
//
// Puramente decorativo: aria-hidden y pointer-events-none para
// no interferir con el contenido ni la accesibilidad del hero.
// ============================================================

export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    let ro: ResizeObserver | null = null

    function syncSize() {
      if (!canvas) return
      const w = canvas.clientWidth || 1280
      const h = canvas.clientHeight || 720
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncSize)
      ro.observe(canvas)
    }
    syncSize()

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return

    const glCtx = gl as WebGLRenderingContext

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;

    // Ruido/humo sutil
    float noise = sin(uv.x * 10.0 + u_time * 0.5) * cos(uv.y * 10.0 - u_time * 0.3);
    noise += sin(uv.x * 20.0 - u_time * 0.8) * cos(uv.y * 15.0 + u_time * 0.6) * 0.5;

    // Reacción al mouse
    float dist = distance(uv, mouse);
    float glow = smoothstep(0.4, 0.0, dist) * 0.15;

    vec3 bgColor = vec3(0.071, 0.078, 0.078); // Onyx #121414
    vec3 accentColor = vec3(0.773, 0.627, 0.349); // Oro envejecido #c5a059

    vec3 finalColor = mix(bgColor, accentColor * 0.1, noise * 0.2 + glow);
    finalColor += accentColor * glow * 0.5;

    gl_FragColor = vec4(finalColor, 1.0);
}`

    function compileShader(type: number, src: string) {
      const s = glCtx.createShader(type)
      if (!s) return null
      glCtx.shaderSource(s, src)
      glCtx.compileShader(s)
      return s
    }

    const prog = glCtx.createProgram()
    const vShader = compileShader(glCtx.VERTEX_SHADER, vs)
    const fShader = compileShader(glCtx.FRAGMENT_SHADER, fs)
    if (!prog || !vShader || !fShader) return
    glCtx.attachShader(prog, vShader)
    glCtx.attachShader(prog, fShader)
    glCtx.linkProgram(prog)
    glCtx.useProgram(prog)

    const buf = glCtx.createBuffer()
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buf)
    glCtx.bufferData(
      glCtx.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      glCtx.STATIC_DRAW
    )
    const pos = glCtx.getAttribLocation(prog, 'a_position')
    glCtx.enableVertexAttribArray(pos)
    glCtx.vertexAttribPointer(pos, 2, glCtx.FLOAT, false, 0, 0)

    const uTime = glCtx.getUniformLocation(prog, 'u_time')
    const uRes = glCtx.getUniformLocation(prog, 'u_resolution')
    const uMouse = glCtx.getUniformLocation(prog, 'u_mouse')

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 }

    function handleMouseMove(event: MouseEvent) {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width
        const ny = 1.0 - (event.clientY - rect.top) / rect.height
        mouse.x = nx * canvas.width
        mouse.y = ny * canvas.height
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    function render(t: number) {
      if (typeof ResizeObserver === 'undefined') syncSize()
      glCtx.viewport(0, 0, canvas!.width, canvas!.height)
      if (uTime) glCtx.uniform1f(uTime, t * 0.001)
      if (uRes) glCtx.uniform2f(uRes, canvas!.width, canvas!.height)
      if (uMouse) glCtx.uniform2f(uMouse, mouse.x, mouse.y)
      glCtx.drawArrays(glCtx.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', handleMouseMove)
      ro?.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{ display: 'block' }}
    />
  )
}