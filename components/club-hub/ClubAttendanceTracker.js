"use client";

import { useState, useEffect } from "react";
import {
  getClubMembers,
  getClubAttendance,
  getClubMeetingDates,
  createAttendanceRecord,
  updateAttendanceRecord,
  getStudentAttendanceHistory
} from "@/lib/clubHelpers";
import { useAuth } from "@/utils/AuthContext";

const MAROON = "#5c1417";

export default function ClubAttendanceTracker({ clubName }) {
  const { user, userData } = useAuth();
  const [members, setMembers] = useState([]);
  const [meetingDates, setMeetingDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewHistory, setViewHistory] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);

  useEffect(() => {
    if (user && clubName) {
      loadData();
    }
  }, [user, clubName]);

  const loadData = async () => {
    if (!clubName) return;
    
    setLoading(true);
    try {
      const [clubMembers, dates] = await Promise.all([
        getClubMembers(clubName),
        getClubMeetingDates(clubName)
      ]);
      
      setMembers(clubMembers);
      setMeetingDates(dates);
      
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
        await loadAttendanceForDate(dates[0]);
      }
    } catch (err) {
      console.error("Error loading attendance data:", err);
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForDate = async (date) => {
    if (!clubName || !date) return;
    
    try {
      const attendanceRecords = await getClubAttendance(clubName, date);
      const attendanceMap = {};
      attendanceRecords.forEach(record => {
        attendanceMap[record.studentId] = record.status;
      });
      setAttendance(attendanceMap);
    } catch (err) {
      console.error("Error loading attendance:", err);
    }
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    await loadAttendanceForDate(date);
  };

  const handleAttendanceChange = async (studentId, status) => {
    if (!clubName || !selectedDate) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const attendanceId = `${clubName.replace(/\s+/g, '_').toLowerCase()}_${selectedDate}_${studentId}`;
      
      // Check if record exists
      const existingRecord = Object.keys(attendance).includes(studentId);
      
      if (existingRecord) {
        await updateAttendanceRecord(attendanceId, status);
      } else {
        const member = members.find(m => m.studentId === studentId);
        await createAttendanceRecord(
          clubName,
          selectedDate,
          studentId,
          member?.studentName || "Unknown",
          status,
          user.uid
        );
      }
      
      setAttendance(prev => ({ ...prev, [studentId]: status }));
      setSuccess("Attendance saved successfully");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving attendance:", err);
      setError("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllPresent = async () => {
    if (!members.length || !selectedDate) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await Promise.all(
        members.map(member => 
          handleAttendanceChange(member.studentId, 'present')
        )
      );
      setSuccess("All members marked as present");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error marking all present:", err);
      setError("Failed to mark all as present");
    } finally {
      setSaving(false);
    }
  };

  const handleViewStudentHistory = async (student) => {
    setSelectedStudent(student);
    setViewHistory(true);
    
    try {
      const history = await getStudentAttendanceHistory(clubName, student.studentId);
      setStudentHistory(history);
    } catch (err) {
      console.error("Error loading student history:", err);
      setError("Failed to load student history");
    }
  };

  const handleNewMeeting = () => {
    const today = new Date().toISOString().split('T')[0];
    if (!meetingDates.includes(today)) {
      setMeetingDates(prev => [today, ...prev]);
      setSelectedDate(today);
      setAttendance({});
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-center text-neutral-600">Loading attendance tracker...</p>
      </div>
    );
  }

  if (viewHistory && selectedStudent) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900">
            Attendance History: {selectedStudent.studentName}
          </h3>
          <button
            type="button"
            onClick={() => setViewHistory(false)}
            className="text-sm text-[#5c1417] hover:underline"
          >
            Back to Tracker
          </button>
        </div>

        <div className="p-4">
          {studentHistory.length === 0 ? (
            <p className="text-center text-neutral-600 py-4">No attendance records found.</p>
          ) : (
            <div className="space-y-2">
              {studentHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{record.meetingDate}</p>
                    <p className="text-xs text-neutral-600">
                      Recorded: {record.recordedAt?.toDate?.()?.toLocaleString() || "Recently"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      record.status === 'present'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {record.status === 'present' ? 'Present' : 'Absent'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">Attendance Tracker</h3>
        <button
          type="button"
          onClick={handleNewMeeting}
          className="rounded-lg bg-[#5c1417] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#731a1f]"
        >
          + New Meeting
        </button>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {meetingDates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-600 mb-4">No attendance records yet.</p>
            <button
              type="button"
              onClick={handleNewMeeting}
              className="rounded-lg bg-[#5c1417] px-4 py-2 text-sm font-semibold text-white hover:bg-[#731a1f]"
            >
              Start First Meeting
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label htmlFor="meeting-date" className="block text-sm font-medium text-neutral-700 mb-2">
                Select Meeting Date
              </label>
              <select
                id="meeting-date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#5c1417] focus:outline-none focus:ring-1 focus:ring-[#5c1417]"
              >
                {meetingDates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>

            {members.length === 0 ? (
              <p className="text-center text-neutral-600 py-4">No members in this club yet.</p>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-neutral-600">
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    disabled={saving}
                    className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-900 hover:bg-green-100 disabled:opacity-50"
                  >
                    Mark All Present
                  </button>
                </div>

                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.studentId}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{member.studentName}</p>
                        <button
                          type="button"
                          onClick={() => handleViewStudentHistory(member)}
                          className="text-xs text-[#5c1417] hover:underline"
                        >
                          View History
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAttendanceChange(member.studentId, 'present')}
                          disabled={saving}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            attendance[member.studentId] === 'present'
                              ? 'bg-green-600 text-white'
                              : 'border border-green-300 bg-green-50 text-green-900 hover:bg-green-100'
                          } disabled:opacity-50`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttendanceChange(member.studentId, 'absent')}
                          disabled={saving}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            attendance[member.studentId] === 'absent'
                              ? 'bg-red-600 text-white'
                              : 'border border-red-300 bg-red-50 text-red-900 hover:bg-red-100'
                          } disabled:opacity-50`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}