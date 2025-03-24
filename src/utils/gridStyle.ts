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
  if (total === 1) return { width: "100%", height: "100%" }
  if (total === 2) return { width: "100%", height: "49.7%" }
  if (total === 3)
    return { width: idx === 2 ? "100%" : "49.3%", height: "49.6%" }
  if (total >= 4) return { width: "49.3%", height: "49.8%" }
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
