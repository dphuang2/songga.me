"use client";

import { updateNameOfPlayer } from "@/utils/supabase/update-name-of-player";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export function PlayerNameInput({
  name,
  playerId,
  customName,
}: {
  name: string;
  playerId: number;
  customName: string | null;
}) {
  const [value, setValue] = useState(customName ? customName : "");
  const [debouncedValue] = useDebounce(value, 300);
  useEffect(() => {
    if (debouncedValue) {
      updateNameOfPlayer({ playerId, name: value });
    }
  }, [debouncedValue]);
  return (
    <input
      className="mt-2 mb-4 p-2 border border-gray-300 rounded-md w-full"
      placeholder={name}
      onChange={(e) => setValue(e.target.value)}
      value={value}
    />
  );
}
