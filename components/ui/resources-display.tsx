import { useState, useEffect } from 'react'
import { Book, X, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton component
import { Resource } from '@/lib/definitions'

interface ResourceDisplayProps {
    resources?: Resource[]
    newResourcesCount: number
    resetNewResourceCount: () => void
}

export default function Component({ resources: propResources, newResourcesCount, resetNewResourceCount }: ResourceDisplayProps) {
    const [isOpen, setIsOpen] = useState(false)

    const defaultResources: Resource[] = [
        {
            id: "1",
            title: "Introduction to RAG",
            description: "Learn the basics of Retrieval-Augmented Generation and its applications in AI",
            link: "https://example.com/intro-rag"
        },
    ]

    const resources = propResources && propResources.length > 0 ? propResources : defaultResources

    useEffect(() => {
        if (isOpen) {
            resetNewResourceCount()
        }
    }, [isOpen, resetNewResourceCount, newResourcesCount])

    return (
        <div className="fixed right-8 top-28 flex items-end">
            {!isOpen && (
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full shadow-lg h-10 w-10 relative"
                    onClick={() => setIsOpen(true)}
                >
                    <Book className="h-5 w-5" />
                    <span className="sr-only">Show Resources</span>
                    {newResourcesCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs"
                        >
                            {newResourcesCount}
                        </Badge>
                    )}
                </Button>
            )}
            {isOpen && (
                <Card className="w-80 h-[28rem] shadow-lg flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
                        <CardTitle className="text-lg">Resources ({resources.length})</CardTitle>
                        <Button variant="ghost" size="sm" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </CardHeader>
                    <ScrollArea className="flex-grow px-4 mb-4">
                        <div className="space-y-3 py-2">
                            {resources.map((resource, index) => (
                                <Card key={index} className="p-3">
                                    {resource.title ? (
                                        <>
                                            <CardTitle className="text-sm mb-1">{resource.title}</CardTitle>
                                            <CardDescription className="text-xs mb-2">{resource.description}</CardDescription>
                                            <Button variant="outline" size="sm" className="w-full text-xs h-7" asChild>
                                                <a href={resource.link} target="_blank" rel="noopener noreferrer">
                                                    View Resource <ExternalLink className="ml-1 h-3 w-3" />
                                                </a>
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Skeleton className="h-8 w-full mb-1" />
                                            <Skeleton className="h-20 w-full" />
                                        </>
                                    )}

                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            )}
        </div>
    )
}
