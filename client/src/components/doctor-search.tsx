import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import debounce from "lodash/debounce";

interface DoctorSearchProps {
  onSearch: (query: string) => void;
}

export default function DoctorSearch({ onSearch }: DoctorSearchProps) {
  const [value, setValue] = useState("");

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch(query);
    }, 300),
    [onSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
      <Input
        type="text"
        placeholder="Search doctors by name or specialty..."
        value={value}
        onChange={handleChange}
        className="pl-10"
      />
    </div>
  );
}
