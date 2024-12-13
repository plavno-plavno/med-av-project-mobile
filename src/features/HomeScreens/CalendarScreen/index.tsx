import React, { useCallback } from "react"
import {
  Calendar,
  CalendarTouchableOpacityProps,
  ICalendarEventBase,
} from "react-native-big-calendar"
import { styles } from "./styles"
import ScreenWrapper from "src/components/ScreenWrapper"
import WeekDays from "src/components/Calendar/WeekDays"
import colors from "src/assets/colors"
import { ActivityIndicator, Text, TouchableOpacity } from "react-native"
import { useAppSelector } from "src/hooks/redux"
import { useGetCalendarEventsQuery } from "src/api/calendarApi/calendarApi"
import { useFocusEffect } from "@react-navigation/native"
import { screenWidth } from "@utils/screenResponsive"

const events = [
  {
    id: 0,
    title: "Meeting",
    start: new Date(2024, 11, 13, 16, 0),
    end: new Date(2024, 11, 13, 17, 30),
    color: colors.ghostWhite
  },
  {
    id: 1,
    title: "Design Onboarding",
    start: new Date(2024, 11, 13, 14, 0),
    end: new Date(2024, 11, 13, 15, 0),
    color: colors.darkCyan
  },
  {
    id: 1,
    title: "Design Onboarding",
    start: new Date(2024, 11, 13, 14, 0),
    end: new Date(2024, 11, 13, 15, 0),
    color: colors.alertRed
  },
  // {
  //   id: 1,
  //   title: "Design Onboarding",
  //   start: new Date(2024, 11, 13, 14, 0),
  //   end: new Date(2024, 11, 13, 15, 0),
  //   color: colors.successGreen
  // },

  {
    id: 2,
    title: "Coffee break",
    start: new Date(2024, 11, 12, 14, 0),
    end: new Date(2024, 11, 12, 15, 0),
    color: colors.lightAqua
  },
]
const CalendarScreen = () => {
  const { selectedDay } = useAppSelector((state) => state.calendar);

  const { data: calendarEventsData, refetch: calendarEventsRefetch, isLoading: isCalendarEventsLoading } = useGetCalendarEventsQuery();
console.log(calendarEventsData, 'calendarEventsData');

  useFocusEffect(useCallback(() => {
    calendarEventsRefetch();
  }, []))

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
    <TouchableOpacity {...touchableOpacityProps} key={Math.random() * 1000} disabled>
      <Text style={styles.eventText}>
        {`${event.title}, ${formatTime(event.start)}– ${formatTime(event.end)}`}
      </Text>
    </TouchableOpacity>
  )

  if (isCalendarEventsLoading) {
    return <ActivityIndicator size={'large'} style={{ top: '50%' }} />
  }
  return (
    <ScreenWrapper childrenStyle={styles.container} isCalendarScreen>
      <Calendar
        events={events}
        height={100}
        mode={"day"}
        onPressEvent={() => console.log("event")}
        minHour={8}
        maxHour={20}
        ampm
        overlapOffset={screenWidth * 0.4}
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
