import { StyleSheet, Text, TouchableOpacity } from "react-native"
import { moderateScale } from "react-native-size-matters"
import { HelpTopicEntity } from "src/api/helpCenterApi/types"
import colors from "src/assets/colors"
import { Icon } from "../Icon"
import React from "react"

type Props = {
  topic: HelpTopicEntity & {
    isSelected: boolean
    onPress: () => void
  }
}

const TopicItem = ({ topic }: Props) => {
  return (
    <TouchableOpacity style={styles.container} onPress={topic.onPress}>
      <Text>{topic.name}</Text>
      {topic.isSelected && <Icon name={"checkCoral"} />}
    </TouchableOpacity>
  )
}

export default React.memo(TopicItem, (prev, next) => {
  return (
    prev.topic.id === next.topic.id &&
    prev.topic.isSelected === next.topic.isSelected
  )
})

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.aquaHaze,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(1),
    height: moderateScale(56),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(10),
  },
})
