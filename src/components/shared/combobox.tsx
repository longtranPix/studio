
'use client';

import * as React from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Check, ChevronsUpDown, Loader2, PlusCircle } from 'lucide-react';
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

type ComboboxItem = { value: string; label: string };

interface ComboboxProps {
  value: string;
  onValueChange: (value: string, label?: string) => void;
  onSearchChange: (search: string) => void;
  searchTerm: string;
  placeholder: string;
  searchFn: (query: any) => Promise<any[]>;
  createFn?: (name: string) => Promise<any>;
  isInvalid?: boolean;
  disabled?: boolean;
}

export function Combobox({
  value,
  onValueChange,
  onSearchChange,
  searchTerm,
  placeholder,
  searchFn,
  createFn,
  isInvalid,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [localItems, setLocalItems] = React.useState<ComboboxItem[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);

  const getLabel = (item: any) => item.fields.name || item.fields.brand_name || item.fields.supplier_name;

  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    if (query && searchFn) {
      setIsLoading(true);
      try {
        const results = await searchFn(query);
        setLocalItems(results.map(r => ({ value: r.id, label: getLabel(r) })));
      } catch (error) {
        console.error("Search function failed:", error);
        setLocalItems([]);
      } finally {
        setIsLoading(false);
      }
    } else {
        setLocalItems([]);
    }
  }, 300);

  const handleSearchChange = (search: string) => {
      onSearchChange(search);
      if (search) {
        debouncedSearch(search);
      } else {
        debouncedSearch.cancel();
        setLocalItems([]);
      }
  }

  const handleCreate = async () => {
    if (!createFn || !searchTerm) return;
    setIsCreating(true);
    try {
        const newItem = await createFn(searchTerm);
        if(newItem && newItem.records && newItem.records.length > 0) {
            const createdRecord = newItem.records[0];
            const newId = createdRecord.id;
            const newLabel = getLabel(createdRecord);
            onValueChange(newId, newLabel);
            setLocalItems(prev => [...prev, { value: newId, label: newLabel }]);
            setOpen(false);
        } else if (newItem) { // Handle cases where the response is the record itself
            const newId = newItem.id;
            const newLabel = getLabel(newItem);
            onValueChange(newId, newLabel);
            setLocalItems(prev => [...prev, { value: newId, label: newLabel }]);
            setOpen(false);
        }
    } catch (error) {
        console.error("Create function failed:", error);
    } finally {
        setIsCreating(false);
    }
  }

  const selectedItemLabel = localItems.find((item) => item.value === value)?.label || searchTerm;

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
          <span className="truncate">
            {value ? selectedItemLabel : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ minWidth: 'var(--radix-popover-trigger-width)'}}>
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} onValueChange={handleSearchChange} value={searchTerm} />
          <CommandList>
            {isLoading && <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
            
            {!isLoading && localItems.length === 0 && searchTerm && createFn && (
                 <CommandItem
                    onSelect={handleCreate}
                    className="flex items-center gap-2 cursor-pointer"
                    disabled={isCreating}
                >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4" />}
                    <span>Tạo mới "{searchTerm}"</span>
                </CommandItem>
            )}

            {!isLoading && localItems.length === 0 && searchTerm && !createFn && (
                <CommandEmpty>Không tìm thấy.</CommandEmpty>
            )}

            <CommandGroup>
              {(localItems || []).map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // Use label for filtering in Command
                  onSelect={() => {
                    onValueChange(item.value, item.label);
                    onSearchChange(item.label);
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

    