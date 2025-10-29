import * as React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, X } from "lucide-react";

export function HotelListInput({
  hotels,
  onChange,
  placeholder = "Nama hotel...",
}) {
  const [input, setInput] = React.useState("");

  const addHotel = () => {
    if (input.trim() && !hotels.includes(input.trim())) {
      onChange([...hotels, input.trim()]);
      setInput("");
    }
  };

  const removeHotel = (idx) => {
    const newHotels = hotels.filter((_, i) => i !== idx);
    onChange(newHotels);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="w-auto min-w-[120px]"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addHotel();
          }
        }}
      />
      <button
        type="button"
        className="p-2 rounded bg-teal-50 text-teal-600"
        onClick={addHotel}
      >
        <PlusCircle className="h-4 w-4" />
      </button>
      {hotels.map((hotel, idx) => (
        <Badge
          key={hotel + idx}
          color="teal"
          className="flex items-center gap-1"
        >
          {hotel}
          <button
            type="button"
            className="ml-1 text-xs"
            onClick={() => removeHotel(idx)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
