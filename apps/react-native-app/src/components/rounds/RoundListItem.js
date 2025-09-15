import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCourseDisplayName } from '../../utils/courseMapper';
import { formatRoundStartTime } from '../../utils/dateFormatter';

const RoundListItem = ({ round }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#22c55e'; // green
      case 'completed':
        return '#3b82f6'; // blue
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getRoundDisplayName = (name) => {
    return name && name.trim() !== '' ? name : 'Unnamed Round';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.roundName} testID="round-name">
        {getRoundDisplayName(round.name)}
      </Text>
      <Text style={styles.courseName} testID="course-name">
        {getCourseDisplayName(round.course_id)}
      </Text>
      <Text style={styles.startTime} testID="start-time">
        {formatRoundStartTime(round.start_time)}
      </Text>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(round.status) }
        ]}
        testID="status-badge"
      >
        <Text style={styles.statusText}>
          {round.status.toUpperCase()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roundName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  startTime: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9ca3af',
    marginBottom: 8,
  },
});

export default RoundListItem;