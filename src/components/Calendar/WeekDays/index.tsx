import { fontFamilies, fontWeights } from "@utils/theme"
import React, { useState } from "react"
import { Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

const WeekCards = () => {
  const [selectedDay, setSelectedDay] = useState("TUE")

  const days = [
    { day: "MON", date: "01" },
    { day: "TUE", date: "02" },
    { day: "WED", date: "03" },
    { day: "THU", date: "04" },
    { day: "FRI", date: "05" },
    { day: "SAT", date: "06" },
    { day: "SUN", date: "07" },
    { day: "MON", date: "08" },
    { day: "TUE", date: "09" },
    { day: "WED", date: "10" },
    { day: "THU", date: "11" },
    { day: "FRI", date: "12" },
    { day: "SAT", date: "13" },
    { day: "SUN", date: "14" },
    { day: "MON", date: "15" },
    { day: "TUE", date: "16" },
    { day: "WED", date: "17" },
    { day: "THU", date: "18" },
    { day: "FRI", date: "19" },
    { day: "SAT", date: "20" },
    { day: "SUN", date: "21" },
    { day: "MON", date: "22" },
    { day: "TUE", date: "23" },
    { day: "WED", date: "24" },
    { day: "THU", date: "25" },
    { day: "FRI", date: "26" },
    { day: "SAT", date: "27" },
    { day: "SUN", date: "28" },
    { day: "MON", date: "29" },
    { day: "TUE", date: "30" },
  ]

  return (
    <ScrollView
      horizontal
      style={styles.container}
      contentContainerStyle={{
        justifyContent: "space-between",
        gap: moderateScale(4),
      }}
    >
      {days.map(({ day, date }) => (
        <TouchableOpacity
          key={date}
          style={[styles.card, selectedDay === day && styles.selectedCard]}
          onPress={() => setSelectedDay(day)}
        >
          <Text
            style={[
              styles.dayText,
              selectedDay === day && styles.selectedDayText,
            ]}
          >
            {day}
          </Text>
          <Text
            style={[
              styles.dateText,
              selectedDay === day && styles.selectedDateText,
            ]}
          >
            {date}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    maxWidth: "96%",
  },
  card: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.borderGrey,
    width: moderateScale(45),
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
  },
  selectedCard: {
    backgroundColor: colors.brandColor,
  },
  dayText: {
    ...fontFamilies.interManropeBold10,
    ...fontWeights.fontWeight600,
    color: colors.cadetGrey,
  },
  selectedDayText: {
    color: colors.white,
  },
  dateText: {
    ...fontFamilies.interManropeBold16,
    ...fontWeights.fontWeight700,
    color: colors.charcoal,
  },
  selectedDateText: {
    color: colors.white,
  },
})

export default WeekCards
