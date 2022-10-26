// --------------- imports ---------------
import {
    log,
    query,
    queryAll,
    addClass,
    removeClass,
    addEl,
    removeEl,
} from "./globalFun.js";

import * as A from "./animations.js";

import * as M from "./menu.js";

import * as GG from "./guessGenerator.js";

import * as F from "./fun.js";

import { validWordsObj } from "./validWords.js";
// --------------- imports ---------------

export let activeRowCounter = 0;

//  guess tracker
export let playersGuessTracker = [];

//  variables
export const keyboard = query(document, ".keyboard");
const keys = queryAll(keyboard, "span");
const unregistered = query(document, ".unregistered");

export function keyboardMechanics(e) {
    removeClass(unregistered, "show-unregistered");

    const target = e.target;

    //  letters
    if (target.matches(":not(div, .fourth-row *, .shift, .shift-icon)")) {
        for (const slot of F.activeRowSlots) {
            if (slot.classList.contains("active-slot")) {
                slot.innerText = target.innerText;

                F.accentShifter("unshift");
            }
        }

        F.changeActiveSlot(F.nextActiveSlot());
    }

    //  space
    if (target.matches(".space, .space-icon")) {
        F.changeActiveSlot(F.nextActiveSlot("loop"), "empty");
    }

    //  shift
    if (target.matches(".shift, .shift-icon")) {
        F.accentShifter("shift");
    }

    //  back space
    if (target.matches(".back-space, .back-space-icon")) {
        F.changeActiveSlot(F.previousActiveSlot(), "empty");
    }

    //  enter
    if (target.matches(".enter, .enter-icon")) {
        let playersGuess = [];
        const guessWord = [...GG.guessWord];

        let gameWon = 0;

        //  empty or not
        const hasEmptySlots = (() => {
            let emptySlotsIndex = [];

            F.activeRowSlots.forEach((slot, index) => {
                const letter = slot.innerText;

                if (letter === "") {
                    slot.animate(...A.emptySlot);

                    emptySlotsIndex.push(index);

                    F.changeActiveSlot(emptySlotsIndex[0]);
                } else if (letter !== "") {
                    if (letter === "هـ") playersGuess.push("ه");
                    else playersGuess.push(letter);
                }
            });

            if (!emptySlotsIndex.length) emptySlotsIndex = false;
            else emptySlotsIndex = true;

            return emptySlotsIndex;
        })();

        //  valid or not
        const invalidGuess = (() => {
            let result;

            //  valid
            if (
                !hasEmptySlots &&
                validWordsObj[5].includes(playersGuess.join(""))
            ) {
                result = false;
            } else if (!hasEmptySlots) {
                //  invalid
                unregistered.lastElementChild.innerText = `${playersGuess.join(
                    ""
                )}`;

                addClass(unregistered, "show-unregistered");

                F.clearInvalidGuess();

                result = true;
            }

            //  duplicate guess
            if (!hasEmptySlots && activeRowCounter > 0) {
                playersGuessTracker.forEach(item => {
                    if (playersGuess.join("") === item[0]) {
                        GG.guessRows[item[1]].animate(
                            ...A.registeredGuessAnime
                        );

                        F.clearInvalidGuess();

                        result = true;
                    }
                });
            }

            return result;
        })();

        //  correct or not
        if (!hasEmptySlots && !invalidGuess) {
            const activatedRows = Array.from(queryAll(document, ".activated"));

            F.activeRowSlots.forEach((slot, index, array) => {
                const letter = slot.innerText === "هـ" ? "ه" : slot.innerText;

                //  no letters included
                if (!guessWord.includes(letter)) {
                    setTimeout(() => {
                        slot.animate(...A.notIncluded);

                        for (const key of keys) {
                            if (key.innerText === letter) {
                                key.animate(
                                    {
                                        color: "#333333",
                                    },
                                    {
                                        duration: 500,
                                        easing: "ease-in-out",
                                        fill: "both",
                                    }
                                );

                                addClass(key, "not-included");
                            }
                        }
                    }, index * 80);
                }

                //  incorrect
                if (
                    guessWord.includes(letter) &&
                    guessWord.indexOf(letter) !== index
                ) {
                    setTimeout(() => {
                        slot.animate(...A.incorrect);
                        addClass(slot, "incorrect");

                        for (const key of keys) {
                            if (
                                key.innerText === letter &&
                                !key.classList.contains("correct")
                            ) {
                                key.animate(
                                    [
                                        {
                                            transform: "scale(1)",
                                            color: "white",
                                        },
                                        {
                                            transform: "scale(0)",
                                            color: "#fdc010",
                                        },
                                        {
                                            transform: "scale(1)",
                                            color: "#fdc010",
                                        },
                                    ],
                                    {
                                        duration: 500,
                                        easing: "ease-in-out",
                                        fill: "both",
                                    }
                                );

                                addClass(key, "incorrect");
                            }
                        }
                    }, index * 80);

                    F.duplicateRemover(
                        activeRowCounter,
                        activatedRows,
                        letter,
                        index,
                        "incorrect"
                    );
                }

                //  correct
                if (guessWord.indexOf(letter) === index) {
                    setTimeout(() => {
                        slot.animate(...A.correct);
                        addClass(slot, "correct");

                        for (const key of keys) {
                            if (key.innerText === letter) {
                                key.animate(
                                    [
                                        {
                                            transform: "scale(1)",
                                            color: "white",
                                        },
                                        {
                                            transform: "scale(0)",
                                            color: "#339900",
                                        },
                                        {
                                            transform: "scale(1)",
                                            color: "#339900",
                                        },
                                    ],
                                    {
                                        duration: 500,
                                        easing: "ease-in-out",
                                        fill: "both",
                                    }
                                );

                                addClass(key, "correct");
                            }
                        }
                    }, index * 80);

                    F.duplicateRemover(
                        activeRowCounter,
                        activatedRows,
                        letter,
                        index,
                        "correct"
                    );

                    guessWord[index] = "";

                    gameWon++;
                }
            });

            playersGuessTracker.push([playersGuess.join(""), activeRowCounter]);

            F.rowActiveState(GG.guessRows[activeRowCounter], "deactive");
        }

        //  game won or not
        if (gameWon === guessWord.length) {
            // game won
            removeEl(keyboard, "click", keyboardMechanics);
            removeClass(keyboard, "show-keyboard");

            addClass(M.downArrow, "show-down-arrow");
            addEl(M.downArrow, "click", M.downArrowF);

            F.word.innerText = GG.guessWord;
            F.word.style.opacity = 1;

            setTimeout(() => {
                F.activeRowSlots.forEach((slot, index) => {
                    setTimeout(() => {
                        slot.animate(...A.winnerFlag);
                    }, index * 120);
                });

                F.theNotch.animate(...A.turnTheNotch);
                F.wordCover.animate(...A.unveilWord);
            }, 800);

            //  game lost
        } else if (
            !hasEmptySlots &&
            !invalidGuess &&
            activeRowCounter + 1 === guessWord.length
        ) {
            setTimeout(() => {
                removeEl(keyboard, "click", keyboardMechanics);
                removeClass(keyboard, "show-keyboard");

                addClass(M.downArrow, "show-down-arrow");
                addEl(M.downArrow, "click", M.downArrowF);
            }, 1000);

            //  next guess
        } else if (
            !hasEmptySlots &&
            !invalidGuess &&
            activeRowCounter < GG.guessRows.length - 1
        ) {
            activeRowCounter++;

            F.rowActiveState(GG.guessRows[activeRowCounter], "active");
        }
    }
}

export function gameReset() {
    playersGuessTracker = [];

    activeRowCounter = 0;

    // row clean up
    while (GG.guessContainer.firstChild) {
        GG.guessContainer.removeChild(GG.guessContainer.firstChild);
    }

    for (const key of keys) {
        removeClass(key, "not-included");
        removeClass(key, "incorrect");
        removeClass(key, "correct");

        key.animate(
            {
                color: "white",
            },
            {
                duration: 0,
                fill: "both",
            }
        );
    }
}
