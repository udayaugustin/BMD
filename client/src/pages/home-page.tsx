import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-700">Book My Doctor</span>
            </div>
            <div className="flex items-center">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="outline">Go to Dashboard</Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button>Login / Register</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Simplify Doctor Appointments</span>
            <span className="block text-blue-600">Save Time, Stay Healthy</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Book doctor appointments seamlessly and manage tokens efficiently with our smart healthcare platform.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/auth">
                <Button size="lg" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <h3 className="mt-2 text-xl font-semibold text-gray-900">Real-time Updates</h3>
            <p className="mt-4 text-gray-500">
              Get instant updates about doctor arrival and current token status.
            </p>
          </div>
          <div className="text-center">
            <h3 className="mt-2 text-xl font-semibold text-gray-900">Smart Booking</h3>
            <p className="mt-4 text-gray-500">
              Book appointments easily and get notified when booking windows open.
            </p>
          </div>
          <div className="text-center">
            <h3 className="mt-2 text-xl font-semibold text-gray-900">Token Management</h3>
            <p className="mt-4 text-gray-500">
              Efficient token system to minimize waiting time and manage queues.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
