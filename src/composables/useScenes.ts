import { ref } from 'vue'
import type { Scene } from '@/types'

const STORAGE_KEY = 'spotify_scenes'

const scenes = ref<Scene[]>(loadScenes())

function loadScenes(): Scene[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveScenes(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes.value))
}

function generateId(): string {
  return crypto.randomUUID()
}

function addScene(scene: Omit<Scene, 'id'>): Scene {
  const newScene: Scene = {
    ...scene,
    id: generateId(),
  }
  scenes.value.push(newScene)
  saveScenes()
  return newScene
}

function getScene(id: string): Scene | undefined {
  return scenes.value.find((s) => s.id === id)
}

export function useScenes() {
  return {
    scenes,
    addScene,
    getScene,
  }
}
