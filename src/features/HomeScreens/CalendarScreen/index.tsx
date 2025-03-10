import React, { useCallback, useEffect, useRef, useState } from "react"
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
import { BottomSheetMethods } from "@devvie/bottom-sheet"
import { formatTime } from "@utils/utils"
import ScheduleMeetingModal from "src/modals/ScheduleMeetingModal"
import { Portal } from "react-native-portalize"
import { useAuthMeQuery } from "src/api/userApi/userApi"
import DetailsEventModal from "src/modals/DetailsEventModal"
import moment from "moment"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { useTimezoneQuery } from "src/api/auth/authApi"

const today = moment().format("YYYY-MM-DD")

const CalendarScreen = () => {
  const { selectedDay } = useAppSelector((state) => state.calendar)
  const sheetDetailsRef = useRef<BottomSheetMethods>(null)
  const sheetScheduleRef = useRef<BottomSheetMethods>(null)
  const [eventId, setEventId] = React.useState(0)
  const [handleEventTime, setCustomEventTime] = React.useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [scrollOffsetMinutes, setScrollOffsetMinutes] = useState(0)
  const scrollRef = useRef<KeyboardAwareScrollView>(null)

  const {
    data: calendarEventsData,
    refetch: calendarEventsRefetch,
    isLoading: isCalendarEventsLoading,
  } = useGetCalendarEventsQuery()

  const { data: authMeData } = useAuthMeQuery()
  const { data: timezone, refetch: timezoneRefetch } = useTimezoneQuery()

  useEffect(() => {
    if (today === selectedDay) {
      const now = moment()
      const startOfDay = moment().startOf("day")
      const minutesElapsed = now.diff(startOfDay, "minutes")

      setScrollOffsetMinutes(minutesElapsed * 0.5)
    } else {
      setScrollOffsetMinutes(0)
    }
  }, [selectedDay])

  const resetEventId = () => {
    setEventId(0)
  }

  const handleOpenDetailsModal = (eventId: number) => {
    setEventId(eventId)
    sheetDetailsRef.current?.open()
  }

  const handleCloseDetailsModal = () => {
    sheetDetailsRef.current?.close()
    resetEventId()
  }

  const handleOpenScheduleModal = () => {
    setIsOpen(true)
    setTimeout(() => {
      sheetScheduleRef.current?.open()
      scrollRef?.current?.scrollToPosition(0, 0, true)
    })
  }

  const handleCloseScheduleModal = () => {
    sheetScheduleRef.current?.close()
  }
  const handleGoModalBack = () => {
    sheetScheduleRef.current?.close()
    sheetDetailsRef.current?.open()
  }
  const transformToAdjustedDate = (time: string) => {
    const parsedDate = new Date(time)

    const year = parsedDate.getUTCFullYear()
    const month = parsedDate.getUTCMonth() // Zero-based index (0 for January)
    const day = parsedDate.getUTCDate()
    const hour = parsedDate.getUTCHours()
    const minute = parsedDate.getUTCMinutes()

    // Adjust the hour using gmtDelta
    const adjustedHour = hour + (timezone?.gmtDelta || 0)
    return new Date(year, month, day, adjustedHour, minute)
  }

  const transformedEvents =
    calendarEventsData?.data?.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: transformToAdjustedDate(event.startDate),
      end: transformToAdjustedDate(event.endDate),
      color: event.color || colors.lightAqua,
      status: event.status,
      participants: event.participants,
    })) || []

  const findParticipantStatusByEmail = (email: string, event: any) => {
    const participant = event.participants.find((p: any) => p.email === email)
    return participant ? participant.status : null
  }

  const renderEvent = <T extends ICalendarEventBase>(
    event: T | any,
    touchableOpacityProps: CalendarTouchableOpacityProps
  ) => {
    const participantStatus = findParticipantStatusByEmail(
      String(authMeData?.email),
      event
    )

    return (
      <TouchableOpacity
        {...touchableOpacityProps}
        key={event?.id}
        style={[styles.eventContainer, touchableOpacityProps.style]}
      >
        <Text
          style={[
            styles.eventText,
            {
              textDecorationLine:
                participantStatus === "decline" ? "line-through" : "none",
              color:
                participantStatus === "accept"
                  ? colors.ghostWhite
                  : participantStatus === "decline"
                  ? colors.placeholder
                  : event.color,
            },
          ]}
        >
          {`${event.title}, ${formatTime(event.start)}– ${formatTime(
            event.end
          )}`}
        </Text>
        <Text
          style={[
            styles.eventText,
            {
              color:
                participantStatus === "accept"
                  ? colors.ghostWhite
                  : participantStatus === "decline"
                  ? colors.placeholder
                  : event.color,
            },
          ]}
        >
          {event.description}
        </Text>
      </TouchableOpacity>
    )
  }

  const handleCreateEvent = (e: string) => {
    setCustomEventTime(e)
    setIsOpen(true)
    setTimeout(() => {
      sheetScheduleRef.current?.open()
    }, 100)
    scrollRef?.current?.scrollToPosition(0, 0, true)
  }

  const onPressEvent = (e: any) => {
    handleOpenDetailsModal(e?.id)
  }

  useFocusEffect(
    useCallback(() => {
      calendarEventsRefetch()
      timezoneRefetch()
    }, [])
  )

  if (isCalendarEventsLoading) {
    return <ActivityIndicator size={"large"} style={{ top: "50%" }} />
  }
  return (
    <>
      <ScreenWrapper childrenStyle={styles.container} isCalendarScreen>
        <Calendar
          events={transformedEvents}
          height={100}
          mode={"day"}
          ampm
          onPressCell={(e) => handleCreateEvent(e as any)}
          onPressEvent={onPressEvent}
          swipeEnabled={false}
          overlapOffset={screenWidth * 0.1}
          date={new Date(selectedDay)}
          scrollOffsetMinutes={scrollOffsetMinutes}
          renderEvent={renderEvent}
          renderHeader={() => {
            return <WeekDays />
          }}
          hourStyle={styles.hourStyle}
          eventCellTextColor={colors.ghostWhite}
          eventCellStyle={(event) => {
            const participantStatus = findParticipantStatusByEmail(
              String(authMeData?.email),
              event
            )
            return [
              styles.cellStyle,
              {
                backgroundColor:
                  participantStatus === "accept" ? event.color : colors.white,
                borderWidth: 1,
                borderColor:
                  participantStatus === "accept"
                    ? event.color
                    : participantStatus === "decline"
                    ? colors.placeholder
                    : event.color,
              },
            ]
          }}
        />
      </ScreenWrapper>
      <Portal>
        <DetailsEventModal
          handleOpenScheduleModal={handleOpenScheduleModal}
          onClose={handleCloseDetailsModal}
          eventId={eventId}
          sheetRef={sheetDetailsRef}
        />
        {isOpen && (
          <ScheduleMeetingModal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            handleEventTime={handleEventTime}
            handleGoModalBack={handleGoModalBack}
            onClose={handleCloseScheduleModal}
            sheetRef={sheetScheduleRef}
            eventId={eventId}
            refetch={calendarEventsRefetch}
            scrollRef={scrollRef}
          />
        )}
      </Portal>
    </>
  )
}

export default CalendarScreen
