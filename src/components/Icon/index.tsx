import { SvgProps } from "react-native-svg"
import * as Icons from "../../assets/icons"

declare global {
  type IconName = keyof typeof Icons
}

interface Props extends SvgProps {
  name: IconName
}

export const Icon = ({ name, ...rest }: Props) => Icons[name](rest)
