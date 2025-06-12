type Recipe = {
	OnTest: Record<string, () => boolean>
	OnCreate: Record<string, () => void>
} 