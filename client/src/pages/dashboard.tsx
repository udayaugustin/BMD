import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Doctor, Appointment } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { DoctorSearch } from "@/components/DoctorSearch";
import { useState } from "react";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  if (isLoadingAppointments || isLoadingDoctors) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-700">Book My Doctor</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <Button variant="outline" onClick={() => logoutMutation.mutate()}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            onClick={() => setShowSearch(!showSearch)}
            className="w-full md:w-auto"
          >
            <Search className="w-4 h-4 mr-2" />
            {showSearch ? "Hide Search" : "Find Nearby Doctors"}
          </Button>

          {showSearch && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Search Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <DoctorSearch />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments?.length === 0 ? (
                <p className="text-gray-500">No appointments scheduled</p>
              ) : (
                <div className="space-y-4">
                  {appointments?.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 border rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">Token #{appointment.tokenNumber}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(appointment.appointmentTime).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          appointment.status === "scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : appointment.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : appointment.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Doctors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doctors?.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="p-4 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{doctor.name}</p>
                      <p className="text-sm text-gray-500">{doctor.specialty}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          doctor.isAvailable
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {doctor.isAvailable ? "Available" : "Unavailable"}
                      </span>
                      {doctor.hasArrived && (
                        <span className="text-sm text-green-600 mt-1">Doctor has arrived</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}