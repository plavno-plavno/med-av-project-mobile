import { Portal } from "react-native-portalize"

const CalendarBottomSheetWrapper = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return <Portal>{children}</Portal>
}

export default CalendarBottomSheetWrapper
