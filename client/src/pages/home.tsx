import { useQuery } from "@tanstack/react-query";
import { Doctor } from "@shared/schema";
import DoctorCard from "@/components/doctor-card";
import DoctorSearch from "@/components/doctor-search";
import { useState } from "react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: doctors = [], isLoading } = useQuery<Doctor[]>({
    queryKey: [searchQuery ? `/api/doctors/search?q=${searchQuery}` : "/api/doctors"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">
            Find Your Doctor
          </h1>
          <p className="text-lg opacity-90">
            Book appointments with the best doctors
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <DoctorSearch onSearch={setSearchQuery} />
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[300px] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}

        {!isLoading && doctors.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No doctors found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
