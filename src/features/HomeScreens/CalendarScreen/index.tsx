import React from "react"
import { Calendar } from "react-native-big-calendar"
import { styles } from "./styles"
import ScreenWrapper from "src/components/ScreenWrapper"
import WeekDays from "src/components/Calendar/WeekDays"
import colors from "src/assets/colors"
import { Text } from "react-native"

const CalendarScreen = () => {
  const events = [
    {
      title: "Meeting",
      start: new Date(2024, 11, 13, 16, 0),
      end: new Date(2024, 11, 13, 17, 30),
      children: <Text style={{ fontSize: 32 }}>HELLO</Text>,
    },
    {
      title: "Coffee break",
      start: new Date(2024, 11, 13, 14, 0),
      end: new Date(2024, 11, 13, 15, 0),
    },
  ]
  const today = new Date()
  return (
    <ScreenWrapper childrenStyle={styles.container} isCalendarScreen>
      <Calendar
        events={events}
        height={100}
        mode={"day"}
        onPressEvent={() => console.log("event")}
        minHour={8}
        // headerContentStyle={{ backgroundColor: "gray" }}
        // dayHeaderStyle={{ backgroundColor: "green" }}
        // dayHeaderHighlightColor={"red"}
        date={today}
        ampm
        renderHeader={() => {
          return <WeekDays />
        }}
        activeDate={new Date()}
        hourStyle={styles.hourStyle}
        eventCellTextColor={colors.ghostWhite}
        eventCellStyle={styles.cellStyle}
      />
    </ScreenWrapper>
  )
}

export default CalendarScreen
