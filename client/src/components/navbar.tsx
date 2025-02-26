import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Navbar() {
  const [, setLocation] = useLocation();
  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/user"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setLocation("/auth");
    },
  });

  return (
    <nav className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Doctor Appointments
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm">
                {user.mobileNumber}
              </span>
              <Button 
                variant="secondary" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </>
          ) : (
            <Button variant="secondary" asChild>
              <Link href="/auth">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
