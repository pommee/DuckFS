"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

interface BreadcrumbNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function BreadcrumbNav({ currentPath, onNavigate }: BreadcrumbNavProps) {
  const pathSegments = currentPath ? currentPath.split("/") : [];
  const breadcrumb = [
    ...pathSegments.map((seg, i) => ({
      name: seg,
      path: pathSegments.slice(0, i + 1).join("/")
    }))
  ];

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {breadcrumb.map((crumb, index) => {
          const isLast = index === breadcrumb.length - 1;

          return (
            <BreadcrumbItem key={crumb.path}>
              {isLast ? (
                <BreadcrumbPage className="font-bold">
                  {crumb.name || "root"}
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => onNavigate(crumb.path)}
                  >
                    {crumb.name || "root"}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
