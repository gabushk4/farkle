import { TrayBounds } from "@/game/types";

export default function SetupDicePosition(index: number, dieSize: number, numDiceInit: number, containerBounds: TrayBounds, gap: number = 0) {
    
    const numDiceOnLine = Math.ceil(numDiceInit / 2) > 5 ? 5 : numDiceInit / 2
    const numLines = Math.ceil(numDiceInit / numDiceOnLine)
    

    const totalWidth = numDiceOnLine * dieSize + (numDiceOnLine - 1) * gap
    const startX = containerBounds.x + (containerBounds.width - totalWidth) / 2
    
    const x = startX + (index % numDiceOnLine) * (dieSize + gap) + dieSize / 2
    
    const totalHeight = numLines * dieSize + (numLines - 1) * gap
    const startY = containerBounds.y + (containerBounds.height - totalHeight) / 2
    const line = Math.floor(index / numDiceOnLine)
    
    const y = startY + line * (dieSize + gap) + dieSize / 2

    return { x, y }
}