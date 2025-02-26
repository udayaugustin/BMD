import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

type DoctorClinic = {
  id: number;
  clinicName: string;
  isAvailable: boolean;
  hasArrived: boolean;
  currentToken: number;
};

type ConsultingHours = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxPatients: number;
};

export function BookAppointment({ doctorId }: { doctorId: number }) {
  const { toast } = useToast();
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);

  // Get doctor's clinics
  const { data: clinics, isLoading: isLoadingClinics } = useQuery<DoctorClinic[]>({
    queryKey: [`/api/doctors/${doctorId}/clinics`],
  });

  // Get consulting hours for selected clinic
  const { data: consultingHours, isLoading: isLoadingHours } = useQuery<ConsultingHours[]>({
    queryKey: [`/api/consulting-hours/${selectedClinicId}`],
    enabled: !!selectedClinicId,
  });

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (doctorClinicId: number) => {
      // Get next token number based on current token
      const currentClinic = clinics?.find(c => c.id === doctorClinicId);
      const nextToken = (currentClinic?.currentToken || 0) + 1;

      const appointmentTime = new Date();
      const res = await apiRequest("POST", "/api/appointments", {
        doctorClinicId,
        appointmentTime: appointmentTime.toISOString(), // Properly format date
        tokenNumber: nextToken,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment Booked",
        description: "Your appointment has been scheduled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoadingClinics) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!clinics?.length) {
    return <p className="text-muted-foreground">No clinics available for this doctor.</p>;
  }

  // If doctor is associated with only one clinic, auto-select it
  if (clinics.length === 1 && !selectedClinicId) {
    setSelectedClinicId(clinics[0].id);
  }

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const formatTime = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), 'hh:mm a');
  };

  return (
    <div className="space-y-4">
      {clinics.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clinics.map((clinic) => (
            <Card
              key={clinic.id}
              className={`cursor-pointer transition-colors ${
                selectedClinicId === clinic.id ? "border-primary" : ""
              }`}
              onClick={() => setSelectedClinicId(clinic.id)}
            >
              <CardContent className="p-4">
                <h3 className="font-medium">{clinic.clinicName}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">
                    Current Token: #{clinic.currentToken}
                  </p>
                  <div className="flex space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        clinic.isAvailable
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {clinic.isAvailable ? "Available" : "Unavailable"}
                    </span>
                    {clinic.hasArrived && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Doctor Present
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedClinicId && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Available Time Slots</h3>
            {isLoadingHours ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : consultingHours?.length ? (
              <div className="space-y-4">
                {consultingHours.map((hours) => (
                  <div key={hours.id} className="border rounded-lg p-4">
                    <p className="font-medium">{getDayName(hours.dayOfWeek)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(hours.startTime)} - {formatTime(hours.endTime)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Maximum patients: {hours.maxPatients}
                    </p>
                    <Button
                      className="mt-2"
                      onClick={() => bookAppointmentMutation.mutate(selectedClinicId)}
                      disabled={bookAppointmentMutation.isPending}
                    >
                      {bookAppointmentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Book Appointment
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No consulting hours available.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}