import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type SearchResult = {
  id: number;
  name: string;
  specialty: string;
  isAvailable: boolean;
  hasArrived: boolean;
  distance: number;
  clinicName: string;
};

export function DoctorSearch() {
  const { toast } = useToast();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [specialty, setSpecialty] = useState<string>("");
  const [maxDistance, setMaxDistance] = useState<number>(10);

  const { data: doctors, isLoading } = useQuery<SearchResult[]>({
    queryKey: [
      "/api/doctors/search",
      {
        latitude: location?.lat,
        longitude: location?.lng,
        maxDistance,
        specialty: specialty || undefined,
      },
    ],
    enabled: !!location,
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        toast({
          title: "Error",
          description: "Unable to get your location: " + error.message,
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Your Location</Label>
          <div className="flex gap-2 mt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={getLocation}
            >
              <MapPin className="w-4 h-4 mr-2" />
              {location ? "Update Location" : "Get Location"}
            </Button>
          </div>
        </div>

        <div>
          <Label>Specialty</Label>
          <Select onValueChange={setSpecialty} value={specialty}>
            <SelectTrigger>
              <SelectValue placeholder="Select specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Specialties</SelectItem>
              <SelectItem value="General Medicine">General Medicine</SelectItem>
              <SelectItem value="Pediatrics">Pediatrics</SelectItem>
              <SelectItem value="Cardiology">Cardiology</SelectItem>
              <SelectItem value="Orthopedics">Orthopedics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Maximum Distance (km)</Label>
          <Input
            type="number"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            min={1}
            max={100}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : doctors?.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No doctors found within the specified criteria
        </p>
      ) : (
        <div className="grid gap-4">
          {doctors?.map((doctor) => (
            <Card key={doctor.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{doctor.name}</h3>
                    <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                    <p className="text-sm">{doctor.clinicName}</p>
                    <p className="text-sm text-muted-foreground">
                      {doctor.distance.toFixed(1)} km away
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                        doctor.isAvailable
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {doctor.isAvailable ? "Available" : "Unavailable"}
                    </span>
                    {doctor.hasArrived && (
                      <p className="text-xs text-green-600 mt-1">Doctor has arrived</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
