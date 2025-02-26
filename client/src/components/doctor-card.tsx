import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Link } from "wouter";
import { Doctor } from "@shared/schema";

interface DoctorCardProps {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <img
          src={doctor.imageUrl}
          alt={doctor.name}
          className="w-full h-48 object-cover"
        />
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2">{doctor.name}</h3>
        <p className="text-muted-foreground mb-4">{doctor.specialty}</p>
        <p className="text-sm">
          {doctor.experience} years of experience
        </p>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full">
          <Link href={`/book/${doctor.id}`}>
            Book Appointment
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
