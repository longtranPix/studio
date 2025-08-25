// src/components/shared/combobox.tsx
'use client';

import * as React from 'react';
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

interface ComboboxProps {
  value: string;
  onValueChange: (value: string, label?: string, record?: any) => Promise<void> | void;
  onSearchChange: (search: string) => void;
  onCreateNew?: (name: string) => Promise<void>;
  initialSearchTerm?: string;
  placeholder: string;
  data: any[];
  isLoading?: boolean;
  isInvalid?: boolean;
  disabled?: boolean;
  displayFormatter?: (item: any) => string;
  valueFormatter?: (item: any) => string;
  isEmbedded?: boolean;
  showCreateOption?: boolean;
}

export function Combobox({
  value,
  onValueChange,
  onSearchChange,
  onCreateNew,
  initialSearchTerm,
  placeholder,
  data,
  isLoading = false,
  isInvalid,
  disabled,
  displayFormatter,
  valueFormatter,
  isEmbedded = false,
  showCreateOption = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [localSearchTerm, setLocalSearchTerm] = React.useState(initialSearchTerm || '');

  const getLabel = React.useCallback(
    (item: any) => displayFormatter ? displayFormatter(item) : item.fields.name || item.fields.brand_name || item.fields.supplier_name || item.fields.value_attribute || item.fields.fullname,
    [displayFormatter]
  );

  const getValueLabel = React.useCallback(
    (item: any) => valueFormatter ? valueFormatter(item) : getLabel(item),
    [valueFormatter, getLabel]
  );
  
  React.useEffect(() => {
    if (initialSearchTerm) {
      setLocalSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  const handleSearchChange = (search: string) => {
      setLocalSearchTerm(search);
      onSearchChange(search);
      if(value){
          onValueChange(''); // Clear selection when user types
      }
  }

  const handleCreate = async () => {
    if (!onCreateNew || !localSearchTerm) return;
    setIsCreating(true);
    try {
        await onCreateNew(localSearchTerm);
        setOpen(false);
    } catch (error) {
        console.error("Create function failed:", error);
    } finally {
        setIsCreating(false);
    }
  }

  const localItems = React.useMemo(() => {
    return (data || []).map(r => ({ value: r.id, label: getLabel(r), record: r }));
  }, [data, getLabel]);

  const selectedItemLabel = React.useMemo(() => {
    if (value) {
        const selectedItem = localItems.find((item) => item.value === value);
        if (selectedItem) return getValueLabel(selectedItem.record);

        // Fallback for when the initial value is set but the item is not yet in the list
        const initialRecord = data?.find(r => r.id === value);
        if(initialRecord) return getValueLabel(initialRecord);
    }
    return '';
  }, [localItems, value, getValueLabel, data]);

  const displayValue = React.useMemo(() => value ? selectedItemLabel : localSearchTerm, [value, selectedItemLabel, localSearchTerm]);

  const isValid = !!value;

  if (isEmbedded) {
    return (
       <Command shouldFilter={false} className="w-full flex-1 bg-transparent">
          <CommandInput 
            placeholder={placeholder} 
            onValueChange={handleSearchChange} 
            value={localSearchTerm} 
            className="h-9 border-none p-0 focus:ring-0"
          />
          <CommandList>
            {isLoading && <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
            
            {!isLoading && localItems.length === 0 && localSearchTerm && showCreateOption && onCreateNew && (
                 <CommandItem
                    onSelect={async () => await handleCreate()}
                    className="flex items-center gap-2 cursor-pointer"
                    disabled={isCreating}
                >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4" />}
                    <span>Tạo mới "{localSearchTerm}"</span>
                </CommandItem>
            )}

            {!isLoading && localItems.length === 0 && localSearchTerm && !showCreateOption && (
                <CommandEmpty>Không tìm thấy.</CommandEmpty>
            )}

            <CommandGroup>
              {(localItems || []).map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // Use label for filtering in Command
                  onSelect={async () => {
                    await onValueChange(item.value, item.label, item.record);
                    setLocalSearchTerm(getValueLabel(item.record));
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
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between", 
            isInvalid && "border-destructive",
            isValid && !isInvalid && "border-green-500"
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {displayValue || placeholder}
          </span>
          {isValid && !isInvalid && <Check className="ml-2 h-4 w-4 shrink-0 text-green-500" />}
          {!isValid && !isInvalid && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ minWidth: 'var(--radix-popover-trigger-width)'}}>
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} onValueChange={handleSearchChange} value={localSearchTerm} />
          <CommandList>
            {isLoading && <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
            
            {!isLoading && localItems.length === 0 && localSearchTerm && showCreateOption && onCreateNew && (
                 <CommandItem
                    onSelect={async () => await handleCreate()}
                    className="flex items-center gap-2 cursor-pointer"
                    disabled={isCreating}
                >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4" />}
                    <span>Tạo mới "{localSearchTerm}"</span>
                </CommandItem>
            )}

            {!isLoading && localItems.length === 0 && localSearchTerm && !showCreateOption && (
                <CommandEmpty>Không tìm thấy.</CommandEmpty>
            )}

            <CommandGroup>
              {(localItems || []).map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // Use label for filtering in Command
                  onSelect={async () => {
                    await onValueChange(item.value, item.label, item.record);
                    setLocalSearchTerm(getValueLabel(item.record));
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