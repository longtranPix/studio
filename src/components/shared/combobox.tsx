
'use client';

import * as React from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  onSearchChange: (search: string) => void;
  searchTerm: string;
  placeholder: string;
  items: { value: string; label: string }[];
  searchFn?: (query: any) => Promise<any[]>;
  isInvalid?: boolean;
  disabled?: boolean;
}

export function Combobox({
  value,
  onValueChange,
  onSearchChange,
  searchTerm,
  placeholder,
  items,
  searchFn,
  isInvalid,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [localItems, setLocalItems] = React.useState(items);

  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    if (query && searchFn) {
      setIsLoading(true);
      const results = await searchFn(query);
      setLocalItems(results.map(r => ({ value: r.id, label: r.fields.name || r.fields.brand_name || r.fields.supplier_name })));
      setIsLoading(false);
    }
  }, 300);

  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);
  
  const handleSearchChange = (search: string) => {
      onSearchChange(search);
      if (searchFn) {
          debouncedSearch(search);
      }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", isInvalid && "border-destructive")}
          disabled={disabled}
        >
          {value
            ? localItems.find((item) => item.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ minWidth: 'var(--radix-popover-trigger-width)'}}>
        <Command shouldFilter={!searchFn}>
          <CommandInput placeholder={placeholder} onValueChange={handleSearchChange} value={searchTerm} />
          <CommandList>
            {isLoading && <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
            {!isLoading && <CommandEmpty>Không tìm thấy.</CommandEmpty>}
            <CommandGroup>
              {localItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? '' : currentValue);
                    const selectedLabel = localItems.find(i => i.value === currentValue)?.label || '';
                    onSearchChange(selectedLabel);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

    