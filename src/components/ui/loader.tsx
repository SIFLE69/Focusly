import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const LoaderOne = ({ className }: { className?: string }) => {
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-screen bg-black", className)}>
            <div className="relative flex items-center justify-center">
                {/* Outer Glow Ring */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.1, 1],
                        rotate: 360
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute w-32 h-32 rounded-full border-t-2 border-b-2 border-blue-500/30 blur-sm"
                />

                {/* Inner Spinning Ring */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute w-24 h-24 rounded-full border-r-2 border-l-2 border-blue-400/50"
                />

                {/* Center Icon */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: 1
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative z-10 flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.5)]"
                >
                    <Zap className="text-white fill-white" size={32} />
                </motion.div>
            </div>

            {/* Loading Text */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 text-center"
            >
                <h2 className="text-2xl font-bold tracking-tighter text-white mb-2">
                    Initializing Focusly
                </h2>
                <div className="flex items-center gap-1 justify-center">
                    <span className="text-neutral-500 text-sm font-medium uppercase tracking-widest">
                        Setting up workspace
                    </span>
                    <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
                        className="text-blue-500"
                    >
                        ...
                    </motion.span>
                </div>
            </motion.div>
        </div>
    );
};
