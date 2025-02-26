import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Get doctor's clinics
  const { data: clinics, isLoading: isLoadingClinics } = useQuery<DoctorClinic[]>({
    queryKey: [`/api/doctors/${doctorId}/clinics`],
  });

  // Get consulting hours for selected clinic
  const { data: consultingHours, isLoading: isLoadingHours } = useQuery<ConsultingHours[]>({
    queryKey: [`/api/consulting-hours/${selectedClinicId}`],
    enabled: !!selectedClinicId,
  });

  // Generate available time slots for today
  const getTimeSlots = () => {
    if (!consultingHours?.length) return [];

    const hours = consultingHours[0]; // Using first set of consulting hours
    const slots: string[] = [];
    const [startHour] = hours.startTime.split(':').map(Number);
    const [endHour] = hours.endTime.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    return slots;
  };

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTimeSlot || !selectedClinicId) {
        throw new Error("Please select a time slot");
      }

      // Create appointment time by combining today's date with selected time
      const today = new Date();
      const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
      const appointmentTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hours,
        minutes,
        0
      );

      const res = await apiRequest("POST", "/api/appointments", {
        doctorClinicId: selectedClinicId,
        appointmentTime: appointmentTime.toISOString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Your appointment has been scheduled successfully.",
      });
      setSelectedTimeSlot(null);
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

  const formatTime = (time: string) => {
    return format(parseISO(`2000-01-01T${time}`), 'hh:mm a');
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

      {selectedClinicId && consultingHours?.length && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Select Appointment Time</h3>
            <div className="space-y-4">
              <Select value={selectedTimeSlot || ''} onValueChange={setSelectedTimeSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose time slot" />
                </SelectTrigger>
                <SelectContent>
                  {getTimeSlots().map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {formatTime(slot)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className="w-full"
                onClick={() => bookAppointmentMutation.mutate()}
                disabled={!selectedTimeSlot || bookAppointmentMutation.isPending}
              >
                {bookAppointmentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Book Appointment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}