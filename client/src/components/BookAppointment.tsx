import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, addDays, setHours, setMinutes, parseISO } from "date-fns";
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  // Generate time slots based on consulting hours
  const getTimeSlots = (hours: ConsultingHours) => {
    const slots: string[] = [];
    const start = parseISO(`2000-01-01T${hours.startTime}`);
    const end = parseISO(`2000-01-01T${hours.endTime}`);

    let current = start;
    while (current <= end) {
      slots.push(format(current, 'HH:mm'));
      current = addDays(current, 0);
      current.setMinutes(current.getMinutes() + 30); // 30-minute slots
    }
    return slots;
  };

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTimeSlot || !selectedClinicId) {
        throw new Error("Please select a time slot");
      }

      // Create appointment time by combining selected date and time
      const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
      const appointmentTime = new Date(selectedDate);
      appointmentTime.setHours(hours, minutes, 0);

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

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

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
            <h3 className="text-lg font-medium mb-4">Available Time Slots</h3>
            {consultingHours.map((hours) => (
              <div key={hours.id} className="border rounded-lg p-4 mb-4">
                <p className="font-medium">{getDayName(hours.dayOfWeek)}</p>
                <p className="text-sm text-muted-foreground mb-2">
                  {formatTime(hours.startTime)} - {formatTime(hours.endTime)}
                </p>
                <Select value={selectedTimeSlot || ''} onValueChange={setSelectedTimeSlot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTimeSlots(hours).map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {format(parseISO(`2000-01-01T${slot}`), 'hh:mm a')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="mt-4"
                  onClick={() => bookAppointmentMutation.mutate()}
                  disabled={!selectedTimeSlot || bookAppointmentMutation.isPending}
                >
                  {bookAppointmentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Book Appointment
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}