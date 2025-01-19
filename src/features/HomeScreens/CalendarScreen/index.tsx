import React, { useCallback, useMemo, useRef } from "react"
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
import { moderateScale } from "react-native-size-matters"

const CalendarScreen = () => {
  const { selectedDay } = useAppSelector((state) => state.calendar)
  const sheetDetailsRef = useRef<BottomSheetMethods>(null)
  const sheetScheduleRef = useRef<BottomSheetMethods>(null)
  const [eventId, setEventId] = React.useState(0)
  const [handleEventTime, setCustomEventTime] = React.useState("")

  const {
    data: calendarEventsData,
    refetch: calendarEventsRefetch,
    isLoading: isCalendarEventsLoading,
  } = useGetCalendarEventsQuery()

  const { data: authMeData } = useAuthMeQuery()

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
    sheetScheduleRef.current?.open()
  }

  const handleCloseScheduleModal = () => {
    resetEventId()
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
    const adjustedHour = hour + (authMeData?.gmtDelta || 0)
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
      <TouchableOpacity {...touchableOpacityProps} key={event?.id}>
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
    sheetScheduleRef.current?.open()
  }

  const onPressEvent = (e: any) => {
    setEventId(e?.id)
    handleOpenDetailsModal(e?.id)
  }

  useFocusEffect(
    useCallback(() => {
      calendarEventsRefetch()
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
          minHour={7}
          onPressCell={(e) => handleCreateEvent(e as any)}
          onPressEvent={onPressEvent}
          swipeEnabled={false}
          overlapOffset={screenWidth * 0.1}
          date={new Date(selectedDay)}
          scrollOffsetMinutes={240}
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
        <ScheduleMeetingModal
          handleEventTime={handleEventTime}
          handleGoModalBack={handleGoModalBack}
          onClose={handleCloseScheduleModal}
          sheetRef={sheetScheduleRef}
          eventId={eventId}
          refetch={calendarEventsRefetch}
        />
      </Portal>
    </>
  )
}

export default CalendarScreen
