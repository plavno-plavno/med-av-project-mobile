import React from "react"
import {
  Calendar,
  CalendarTouchableOpacityProps,
  ICalendarEventBase,
} from "react-native-big-calendar"
import { styles } from "./styles"
import ScreenWrapper from "src/components/ScreenWrapper"
import WeekDays from "src/components/Calendar/WeekDays"
import colors from "src/assets/colors"
import { Text, TouchableOpacity } from "react-native"
import { useAppSelector } from "src/hooks/redux"

const CalendarScreen = () => {
  const events = [
    {
      title: "Meeting",
      start: new Date(2024, 11, 13, 16, 0),
      end: new Date(2024, 11, 13, 17, 30),
      color: colors.lightAqua,
    },
    {
      title: "Design Onboarding",
      start: new Date(2024, 11, 13, 14, 0),
      end: new Date(2024, 11, 13, 15, 0),
      color: colors.alertRed,
    },
    {
      title: "Coffee break",
      start: new Date(2024, 11, 12, 14, 0),
      end: new Date(2024, 11, 12, 15, 0),
      color: colors.lightAqua,
    },
  ]

  const { selectedDay } = useAppSelector((state) => state.calendar)

  const formatTime = (date: Date) => {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const period = hours >= 12 ? "PM" : "AM"
    const formattedHours = hours % 12 || 12

    return `${formattedHours} ${minutes ? `${minutes} ${period}` : period}`
  }

  const renderEvent = <T extends ICalendarEventBase>(
    event: T,
    touchableOpacityProps: CalendarTouchableOpacityProps
  ) => (
    <TouchableOpacity {...touchableOpacityProps}>
      <Text style={styles.eventText}>
        {`${event.title}, ${formatTime(event.start)}– ${formatTime(event.end)}`}
      </Text>
    </TouchableOpacity>
  )

  return (
    <ScreenWrapper childrenStyle={styles.container} isCalendarScreen>
      <Calendar
        events={events}
        overlapOffset={40}
        height={100}
        mode={"day"}
        onPressEvent={() => console.log("event")}
        minHour={8}
        maxHour={20}
        ampm
        date={new Date(selectedDay)}
        renderEvent={renderEvent}
        renderHeader={() => {
          return <WeekDays />
        }}
        hourStyle={styles.hourStyle}
        eventCellTextColor={colors.ghostWhite}
        eventCellStyle={(event) => [
          styles.cellStyle,
          { backgroundColor: event.color },
        ]}
        calendarCellTextStyle={styles.cellTextColor}
      />
    </ScreenWrapper>
  )
}

export default CalendarScreen
