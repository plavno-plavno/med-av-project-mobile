import {
  AudioStream,
  IUsersAudioTrackToIdMap,
  IUsersVideoTrackToIdMap,
  ParticipantsInfo,
  RemoteStream,
  User,
  VideoStream,
} from "@utils/meeting"

type PrepareParticipantsParams = {
  participantsInfo: ParticipantsInfo[]
  invitedParticipantsRef: any
  setParticipants: (data: any) => void
  getUsersById: (userId: any) => any
}

export const fetchMissingUsers = async (
  participantsInfo: { userId: number }[],
  existingUsers: User[],
  getUsersById: (userId: any) => any
) => {
  const existingUserIds = new Set(
    existingUsers.filter(Boolean).map(({ id }) => id)
  )

  const missingUserIds = participantsInfo
    .map(({ userId }) => userId)
    .filter((userId) => !existingUserIds.has(userId))

  if (missingUserIds.length === 0) {
    return []
  }

  const userFetchPromises = missingUserIds.map((userId) =>
    getUsersById({
      id: userId,
    }).unwrap()
  )

  const results = await Promise.allSettled(userFetchPromises)

  return results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r: any) => r?.value)
}

export const prepareParticipants = async ({
  participantsInfo,
  invitedParticipantsRef,
  setParticipants,
  getUsersById,
}: PrepareParticipantsParams) => {
  const usersAudioVideoMap: Record<
    string,
    { isAudioOn: boolean; isVideoOn: boolean; socketId: string }
  > = {}

  participantsInfo.forEach((participant) => {
    usersAudioVideoMap[participant.socketId] = {
      isAudioOn: participant.status.isAudioOn,
      isVideoOn: participant.status.isVideoOn,
      socketId: participant.socketId,
    }
  })

  const fetchedUsersWrapped = await fetchMissingUsers(
    participantsInfo,
    invitedParticipantsRef.current,
    getUsersById
  )
  const fetchedUsers = fetchedUsersWrapped.map((item) => item.user)
  invitedParticipantsRef.current.push(...fetchedUsers)

  const newUsers = participantsInfo.map(({ userId, socketId }) => {
    const {
      firstName = "Guest",
      lastName = "",
      photo = null,
      email = "",
    } = invitedParticipantsRef.current.find(
      ({ id }: { id: any }) => Number(userId) === Number(id)
    ) || {}

    return {
      userId,
      socketId,
      firstName,
      lastName,
      photo,
      isAudioOn: usersAudioVideoMap[socketId].isAudioOn,
      isVideoOn: usersAudioVideoMap[socketId].isVideoOn,
      email,
    }
  })
  setParticipants(newUsers)
}

type AdaptParticipantsParams = {
  remoteAudioStreams: AudioStream[]
  usersAudioTrackToIdMap: IUsersAudioTrackToIdMap
  remoteVideoStreams: VideoStream[]
  usersVideoTrackToIdMap: IUsersVideoTrackToIdMap
  localStream: RemoteStream | null
}

export const adaptParticipantsToShow = ({
  remoteAudioStreams,
  usersAudioTrackToIdMap,
  remoteVideoStreams,
  usersVideoTrackToIdMap,
  localStream,
}: AdaptParticipantsParams): RemoteStream[] => {
  const remoteStreams: Record<string | number, RemoteStream> = {}

  remoteAudioStreams.forEach((audioStream) => {
    const midId = Number(audioStream.midId)
    const socketId = usersAudioTrackToIdMap[midId]

    if (socketId) {
      if (!remoteStreams[socketId]) {
        remoteStreams[socketId] = {
          socketId: socketId,
          audioTrack: null,
          videoTrack: null,
        }
      }

      remoteStreams[socketId].audioTrack = audioStream.audioTrack
    }
  })

  remoteVideoStreams.forEach((videoStream) => {
    const midId = Number(videoStream.midId)
    const socketId = usersVideoTrackToIdMap[midId]

    if (socketId) {
      if (!remoteStreams[socketId]) {
        remoteStreams[socketId] = {
          socketId: socketId,
          audioTrack: null,
          videoTrack: null,
        }
      }

      remoteStreams[socketId].videoTrack = videoStream.videoTrack
    }
  })

  const participants = Object.values(remoteStreams)

  if (localStream) {
    participants.unshift(localStream)
  }

  return participants
}
