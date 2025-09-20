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
import Image from 'next/image';

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
  className?: string; // Add className prop
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
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm || '');

  const getLabel = React.useCallback(
    (item: any) => displayFormatter ? displayFormatter(item) : item.fields.name || item.fields.brand_name || item.fields.supplier_name || item.fields.value_attribute || item.fields.fullname || item.name,
    [displayFormatter]
  );
  
  const getValueLabel = React.useCallback(
      (item: any) => valueFormatter ? valueFormatter(item) : getLabel(item),
      [valueFormatter, getLabel]
  );

  React.useEffect(() => {
      if (!value) {
        setSearchTerm(initialSearchTerm || '');
      }
  }, [initialSearchTerm, value]);

  // Initialize search term on mount
  React.useEffect(() => {
    if (initialSearchTerm && !searchTerm) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm, searchTerm]);

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    onSearchChange(search);
    if(value){
        onValueChange(''); // Clear selection when user types
    }
  }

  const handleCreate = async () => {
    if (!onCreateNew || !searchTerm) return;
    setIsCreating(true);
    try {
        await onCreateNew(searchTerm);
        setOpen(false);
    } catch (error) {
        console.error("Create function failed:", error);
    } finally {
        setIsCreating(false);
    }
  }

  const handleSelect = async (item: any) => {
      await onValueChange(item.value, item.label, item.record);
      setSearchTerm(getValueLabel(item.record));
      setOpen(false);
  }

  const localItems = React.useMemo(() => {
    const items = (data || []).map(r => ({ 
      value: r.shortName || r.id, 
      label: getLabel(r), 
      record: r 
    }));
    
    // Filter items based on search term
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      return items.filter(item => 
        item.label.toLowerCase().includes(searchLower) ||
        (item.record?.shortName && item.record.shortName.toLowerCase().includes(searchLower)) ||
        (item.record?.name && item.record.name.toLowerCase().includes(searchLower))
      );
    }
    
    return items;
  }, [data, getLabel, searchTerm]);

  const selectedItemLabel = React.useMemo(() => {
      if (value) {
          const selectedItem = localItems.find((item) => item.value === value);
          if (selectedItem) return getValueLabel(selectedItem.record);
      }
      return '';
  }, [localItems, value, getValueLabel]);


  const displayValue = value ? selectedItemLabel : searchTerm;
  const isValid = !!value;

  if (isEmbedded) {
    return (
       <Command shouldFilter={false} className="w-full flex-1 bg-transparent">
          <CommandInput 
            placeholder={placeholder} 
            onValueChange={handleSearchChange} 
            value={searchTerm} 
            className="h-9 border-none p-0 focus:ring-0 px-3"
          />
          <CommandList className="max-h-[200px] sm:max-h-[300px] overflow-auto">
            {isLoading && (
              <div className="p-4 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin"/>
              </div>
            )}
            
            {!isLoading && localItems.length === 0 && searchTerm && showCreateOption && onCreateNew && (
                 <CommandItem
                    onSelect={async () => await handleCreate()}
                    className="flex items-center gap-2 cursor-pointer px-3 py-2"
                    disabled={isCreating}
                >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4" />}
                    <span className="truncate">Tạo mới "{searchTerm}"</span>
                </CommandItem>
            )}

            {!isLoading && localItems.length === 0 && searchTerm && !showCreateOption && (
                <CommandEmpty className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Không tìm thấy.
                </CommandEmpty>
            )}

            <CommandGroup>
              {(localItems || []).map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // Use label for filtering in Command
                  onSelect={() => handleSelect(item)}
                  className="flex items-center justify-start gap-3 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      value === item.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.record?.logo && (
                    <Image 
                      src={item.record.logo} 
                      alt={item.label} 
                      width={32} 
                      height={32} 
                      className="shrink-0 rounded-sm object-contain"
                    />
                  )}
                  <span className="text-sm font-medium text-left flex-1">{item.record?.shortName || item.label}</span>
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
            "w-full justify-between h-auto min-h-[40px] px-3 py-2", 
            isInvalid && "border-destructive",
            isValid && !isInvalid && "border-green-500",
            className // Apply external className
          )}
          disabled={disabled}
        >
          <span className="text-left whitespace-normal truncate flex-1 mr-2">
            {displayValue || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {isValid && !isInvalid && <Check className="h-4 w-4 text-green-500" />}
            {!isValid && !isInvalid && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 z-50" 
        style={{ 
          width: 'var(--radix-popover-trigger-width)',
          maxWidth: 'min(90vw, 400px)'
        }}
        align="start"
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={8}
      >
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={placeholder} 
            onValueChange={handleSearchChange} 
            value={searchTerm}
            className="h-9 px-3 border-0 focus:ring-0"
          />
          <CommandList className="max-h-[200px] sm:max-h-[300px] overflow-auto">
            {isLoading && (
              <div className="p-4 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin"/>
              </div>
            )}
            
            {!isLoading && localItems.length === 0 && searchTerm && showCreateOption && onCreateNew && (
                 <CommandItem
                    onSelect={async () => await handleCreate()}
                    className="flex items-center gap-2 cursor-pointer px-3 py-2"
                    disabled={isCreating}
                >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4" />}
                    <span className="truncate">Tạo mới "{searchTerm}"</span>
                </CommandItem>
            )}

            {!isLoading && localItems.length === 0 && searchTerm && !showCreateOption && (
                <CommandEmpty className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Không tìm thấy.
                </CommandEmpty>
            )}

            <CommandGroup>
              {(localItems || []).map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // Use label for filtering in Command
                  onSelect={() => handleSelect(item)}
                  className="flex items-center justify-start gap-3 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      value === item.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.record?.logo && (
                    <Image 
                      src={item.record.logo} 
                      alt={item.label} 
                      width={32} 
                      height={32} 
                      className="shrink-0 rounded-sm object-contain"
                    />
                  )}
                  <span className="text-sm font-medium text-left flex-1">{item.record?.shortName || item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
