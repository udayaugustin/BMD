import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertAppointment, insertAppointmentSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AppointmentFormProps {
  doctorId: number;
}

export default function AppointmentForm({ doctorId }: AppointmentFormProps) {
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);

  const form = useForm<InsertAppointment>({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: {
      doctorId,
      patientName: "",
      phoneNumber: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertAppointment) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return res.json();
    },
    onSuccess: (data) => {
      setSuccess(true);
      toast({
        title: "Appointment Booked!",
        description: `Your token number is ${data.tokenNumber}`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: InsertAppointment) => {
    mutation.mutate(data);
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <h3 className="text-2xl font-bold mb-2">Appointment Confirmed!</h3>
        <p className="text-muted-foreground mb-4">
          Your token number is: <span className="font-bold text-xl">{mutation.data.tokenNumber}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Please arrive 15 minutes before your appointment time
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="patientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input {...field} type="tel" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Booking..." : "Book Appointment"}
        </Button>
      </form>
    </Form>
  );
}
