import React from "react"
import { fontFamilies, fontWeights } from "@utils/theme"
import { Text, StyleSheet, TouchableOpacity, FlatList } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"
import { useAppDispatch, useAppSelector } from "src/hooks/redux"
import { setSelectedDay } from "src/redux/slices/calendarSlice/calendarSlice"

const WeekCards = () => {
  const dispatch = useAppDispatch()

  const { currentDate, selectedDay } = useAppSelector((state) => state.calendar)

  const handleSelectedDay = (day: string) => {
    dispatch(setSelectedDay(day))
  }
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = currentDate.clone().startOf("week").add(index, "days")
    return {
      day: date.format("ddd"),
      date: date.format("DD"),
      displayDate: date.format("YYYY-MM-DD"),
    }
  })
  return (
    <>
      <FlatList
        pagingEnabled
        horizontal
        data={weekDays}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyExtractor={(item) => item.displayDate}
        renderItem={({ item }) => {
          const isSelectedDate = selectedDay == item.displayDate
          return (
            <TouchableOpacity
              onPress={() => handleSelectedDay(item.displayDate)}
              style={[styles.card, isSelectedDate && styles.selectedCard]}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelectedDate && styles.selectedDayText,
                ]}
              >
                {item.day}
              </Text>
              <Text
                style={[
                  styles.dateText,
                  isSelectedDate && styles.selectedDateText,
                ]}
              >
                {item.date}
              </Text>
            </TouchableOpacity>
          )
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    maxWidth: "96%",
  },
  contentContainer: {
    justifyContent: "space-between",
    gap: moderateScale(4),
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
