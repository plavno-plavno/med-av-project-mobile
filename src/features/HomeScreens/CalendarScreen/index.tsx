import React, { useCallback } from "react"
import {
  Calendar,
  CalendarTouchableOpacityProps,
  ICalendarEventBase,
} from "react-native-big-calendar"
import ScreenWrapper from "src/components/ScreenWrapper"
import WeekDays from "src/components/Calendar/WeekDays"
import colors from "src/assets/colors"
import { ActivityIndicator, Text, TouchableOpacity } from "react-native"
import { useAppSelector } from "src/hooks/redux"
import { useGetCalendarEventsQuery } from "src/api/calendarApi/calendarApi"
import { useFocusEffect } from "@react-navigation/native"
import { screenWidth } from "@utils/screenResponsive"
import { styles } from "./styles"

const CalendarScreen = () => {
  const { selectedDay } = useAppSelector((state) => state.calendar)

  const {
    data: calendarEventsData,
    refetch: calendarEventsRefetch,
    isLoading: isCalendarEventsLoading,
  } = useGetCalendarEventsQuery()

  console.log(calendarEventsData, "calendarEventsData")

  const formatTime = (date: Date) => {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const period = hours >= 12 ? "PM" : "AM"
    const formattedHours = hours % 12 || 12

    return `${formattedHours} ${minutes ? `${minutes} ${period}` : period}`
  }

  const transformedEvents =
    calendarEventsData?.data?.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
      color: event.color || colors.lightAqua,
      status: event.status,
      participants: event.participants,
    })) || []

  useFocusEffect(
    useCallback(() => {
      calendarEventsRefetch()
    }, [])
  )
  const renderEvent = <T extends ICalendarEventBase>(
    event: T,
    touchableOpacityProps: CalendarTouchableOpacityProps
  ) => (
    <TouchableOpacity {...touchableOpacityProps} key={event.id}>
      <Text style={styles.eventText}>
        {`${event.title}, ${formatTime(event.start)}– ${formatTime(event.end)}`}
      </Text>
    </TouchableOpacity>
  )

  if (isCalendarEventsLoading) {
    return <ActivityIndicator size={"large"} style={{ top: "50%" }} />
  }
  return (
    <ScreenWrapper childrenStyle={styles.container} isCalendarScreen>
      <Calendar
        events={transformedEvents}
        height={100}
        mode={"day"}
        onPressEvent={() => console.log("event")}
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
