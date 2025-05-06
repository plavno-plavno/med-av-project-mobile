import { ViewStyle } from "react-native"

const getSharedGridStyle = (total: number): ViewStyle => {
  if (total === 1) return { width: "100%", height: "100%" }
  if (total >= 2) return { width: "49.3%", height: "50%" }
  return { width: "100%", height: "100%" }
}

const getRegularGridStyle = (
  idx: number | undefined,
  total: number
): ViewStyle => {
  const clampedTotal = Math.min(total, 6)

  if (clampedTotal === 1) return { width: "100%", height: "100%" }
  if (clampedTotal === 2) return { width: "100%", height: "49.3%" }
  if (clampedTotal === 3)
    return { width: idx === 2 ? "100%" : "49.3%", height: "49.3%" }
  if (clampedTotal === 4) return { width: "49.3%", height: "49.6%" }
  if (clampedTotal === 5) return { width: "49.3%", height: "33%" }
  if (clampedTotal === 6) return { width: "49.3%", height: "33%" }

  return { width: "100%", height: "100%" }
}

export const getGridStyle = ({
  idx,
  total,
  sharingOwner,
}: {
  idx?: number
  total: number
  sharingOwner?: number
}): ViewStyle => {
  return sharingOwner
    ? getSharedGridStyle(total)
    : getRegularGridStyle(idx, total)
}
