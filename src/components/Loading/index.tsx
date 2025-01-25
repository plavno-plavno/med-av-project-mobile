import { helpers } from "@utils/theme"

import { ActivityIndicator, View } from "react-native"

const Loading = () => {
  return (
    <View style={[helpers.flex1, helpers.flexCenter]}>
      <ActivityIndicator size="large" />
    </View>
  )
}

export default Loading
