import { useQuery } from "@tanstack/react-query";
import { Route, useLocation } from "wouter";
import { User } from "@shared/schema";

export function ProtectedRoute({ 
  path, 
  component: Component 
}: { 
  path: string;
  component: React.ComponentType;
}) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    onError: () => {
      setLocation("/auth");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return <Route path={path} component={Component} />;
}
