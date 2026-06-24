import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 이 설정을 추가해서 MediaPipe 에러를 방지
  optimizeDeps: {
    exclude: [
      '@mediapipe/hands', 
      '@mediapipe/camera_utils', 
      '@mediapipe/drawing_utils'
    ]
  }
})
