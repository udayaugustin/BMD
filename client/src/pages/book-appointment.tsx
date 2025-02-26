import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Doctor } from "@shared/schema";
import AppointmentForm from "@/components/appointment-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function BookAppointment() {
  const { id } = useParams<{ id: string }>();

  const { data: doctor, isLoading } = useQuery<Doctor>({
    queryKey: [`/api/doctors/${id}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="animate-pulse">
            <CardContent className="h-[400px]" />
          </Card>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Doctor not found</h2>
          <Button asChild>
            <Link href="/">Go Back</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Doctors
          </Link>
        </Button>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <img
                src={doctor.imageUrl}
                alt={doctor.name}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <h2 className="text-2xl font-bold">{doctor.name}</h2>
                <p className="text-muted-foreground">{doctor.specialty}</p>
              </div>
            </div>
            
            <AppointmentForm doctorId={doctor.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
