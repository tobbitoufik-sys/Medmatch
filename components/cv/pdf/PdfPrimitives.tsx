import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer";

import type {
  CvPdfData,
  CvPdfEntry,
  CvPdfMainSectionOrderKey
} from "@/components/cv/pdf/buildCvPdfData";
import type {
  PdfMainSectionKey,
  PdfSidebarSectionKey,
  PdfTemplateConfig
} from "@/components/cv/pdf/pdfTemplateConfig";
import { normalizePdfText } from "@/components/cv/pdf/pdfText";
import {
  getCvPhotoObjectPosition,
  normalizeCvPhotoPresentation
} from "@/components/cv/v2/cv-photo-state";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    color: "#162033"
  },
  shell: {
    minHeight: "95%",
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1
  },
  sidebar: {
    minHeight: "100%"
  },
  sidebarInner: {
    minHeight: "100%",
    flexDirection: "column"
  },
  sidebarPhotoWrap: {
    alignItems: "center"
  },
  photoFrame: {
    backgroundColor: "#edf3f1",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center"
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  photoFallback: {
    fontSize: 30,
    fontWeight: 700,
    color: "#395364"
  },
  sidebarName: {
    fontWeight: 700,
    color: "#162033",
    marginBottom: 4
  },
  sidebarSubtitle: {
    lineHeight: 1.35,
    color: "#4c6270"
  },
  sidebarStack: {
    flexDirection: "column"
  },
  sideTitle: {
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#516572",
    marginBottom: 8
  },
  sideText: {
    lineHeight: 1.45,
    color: "#243443",
    marginBottom: 4
  },
  kicker: {
    fontSize: 8.8,
    textTransform: "uppercase",
    color: "#8ea1af",
    marginBottom: 10
  },
  fullName: {
    fontSize: 27,
    fontWeight: 700,
    lineHeight: 1.08,
    color: "#101828",
    marginBottom: 5
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 1.38,
    color: "#536576"
  },
  sectionTitle: {
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#566877",
    marginBottom: 9
  },
  entries: {
    flexDirection: "column"
  },
  entry: {
    breakInside: "avoid"
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  entryLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12
  },
  dateColumn: {
    flexShrink: 0,
    alignItems: "flex-end"
  },
  entryTitle: {
    fontSize: 11.1,
    fontWeight: 700,
    lineHeight: 1.28,
    color: "#162033"
  },
  entryDate: {
    fontSize: 9.7,
    lineHeight: 1.28,
    color: "#6b7280",
    textAlign: "right"
  },
  entryBody: {
    paddingTop: 3
  },
  entrySubtitle: {
    fontSize: 10.2,
    lineHeight: 1.38,
    color: "#425567"
  },
  entryMeta: {
    fontSize: 9.9,
    lineHeight: 1.34,
    color: "#61717f",
    marginTop: 2
  },
  bulletList: {
    paddingTop: 4,
    paddingLeft: 8
  },
  bullet: {
    fontSize: 9.8,
    lineHeight: 1.42,
    color: "#314152",
    marginTop: 3
  }
});

function getDensityValue(
  config: PdfTemplateConfig,
  compactValue: number,
  comfortableValue: number
) {
  return config.density === "compact" ? compactValue : comfortableValue;
}

function getSidebarSectionItems(data: CvPdfData, key: PdfSidebarSectionKey) {
  if (key === "contact") {
    return { title: "Kontakt", items: data.contact };
  }

  return { title: "Sprachen", items: data.languages };
}

function getMainSectionEntries(data: CvPdfData, key: PdfMainSectionKey) {
  if (key === "workExperience") {
    return { title: "Berufserfahrung", entries: data.workExperience };
  }

  if (key === "education") {
    return { title: "Ausbildung", entries: data.education };
  }

  if (key === "additionalSections") {
    return { title: "Weitere Angaben", entries: data.additionalSections };
  }

  return { title: "Fortbildungen", entries: data.fortbildungen };
}

function getMainColumnWidth(sidebarWidth: string) {
  const parsedWidth = Number.parseFloat(sidebarWidth);

  if (Number.isNaN(parsedWidth)) {
    return "68%";
  }

  return `${100 - parsedWidth}%`;
}

export function PdfPhotoBlock({
  config,
  initials,
  photoUrl,
  preparedPhotoSrc,
  photoPresentation
}: {
  config: PdfTemplateConfig;
  initials: string;
  photoUrl?: string | null;
  preparedPhotoSrc?: CvPdfData["identity"]["preparedPhotoSrc"];
  photoPresentation?: CvPdfData["identity"]["photoPresentation"];
}) {
  const photoConfig = config.sidebar.photo;
  const normalizedPhotoPresentation = normalizeCvPhotoPresentation(
    photoPresentation,
    config.photoShape
  );
  const renderPhotoSrc = preparedPhotoSrc ?? photoUrl;

  return (
    <View
      style={config.photoShape === "circle" ? styles.sidebarPhotoWrap : undefined}
    >
      <View
        style={[
          styles.photoFrame,
          {
            width: photoConfig.width,
            height: photoConfig.height,
            borderRadius: photoConfig.radius,
            borderColor: photoConfig.borderColor,
            borderWidth: photoConfig.borderWidth,
            marginBottom: photoConfig.marginBottom
          }
        ]}
      >
        {renderPhotoSrc ? (
          <Image
            src={renderPhotoSrc}
            style={[
              styles.photo,
              ...(preparedPhotoSrc
                ? []
                : [
                    {
                      objectPosition:
                        photoConfig.objectPosition ??
                        getCvPhotoObjectPosition(normalizedPhotoPresentation)
                    }
                  ])
            ]}
          />
        ) : (
          <Text style={styles.photoFallback}>{initials}</Text>
        )}
      </View>
    </View>
  );
}

export function PdfCompactSection({
  config,
  title,
  items
}: {
  config: PdfTemplateConfig;
  title: string;
  items: string[];
}) {
  if (!items.length) {
    return null;
  }

  const blockStyle = config.sidebar.blockDividerColor
    ? {
        paddingBottom: config.sidebar.blockPaddingBottom ?? 0,
        borderBottomWidth: 1,
        borderBottomColor: config.sidebar.blockDividerColor
      }
    : {};

  return (
    <View style={blockStyle} wrap={false}>
      <Text
        style={[
          styles.sideTitle,
          {
            fontSize: config.sections.titleSize,
            letterSpacing: config.sections.titleLetterSpacing
          }
        ]}
      >
        {title}
      </Text>
      {items.map((item) => (
        <Text key={item} style={[styles.sideText, { fontSize: 10.2 }]}>
          {normalizePdfText(item)}
        </Text>
      ))}
    </View>
  );
}

export function PdfDateColumn({
  config,
  dateLabel
}: {
  config: PdfTemplateConfig;
  dateLabel?: string | null;
}) {
  if (!dateLabel) {
    return null;
  }

  return (
    <View style={[styles.dateColumn, { width: config.dateColumnWidth }]}>
      <Text style={styles.entryDate}>{normalizePdfText(dateLabel)}</Text>
    </View>
  );
}

export function PdfEntryRow({
  config,
  entry
}: {
  config: PdfTemplateConfig;
  entry: CvPdfEntry;
}) {
  const isMedicalLicense = entry.itemType === "medical_license";

  return (
    <View
      style={[styles.entry, { marginBottom: getDensityValue(config, 10, 12) }]}
      wrap={false}
    >
      <View style={styles.entryHeader}>
        <View style={styles.entryLeft}>
          <Text style={styles.entryTitle}>{normalizePdfText(entry.title)}</Text>
        </View>
        <PdfDateColumn
          config={config}
          dateLabel={isMedicalLicense ? entry.sinceLabel : entry.dateLabel}
        />
      </View>

      {(entry.subtitle || entry.meta || entry.bullets?.length || entry.issuerLine || entry.sinceLabel) ? (
        <View style={styles.entryBody}>
          {isMedicalLicense ? (
            <>
              {entry.issuerLine ? (
                <Text style={styles.entrySubtitle}>
                  {normalizePdfText(entry.issuerLine)}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              {entry.subtitle ? (
                <Text style={styles.entrySubtitle}>
                  {normalizePdfText(entry.subtitle)}
                </Text>
              ) : null}
              {entry.meta ? (
                <Text style={styles.entryMeta}>{normalizePdfText(entry.meta)}</Text>
              ) : null}
            </>
          )}
          {entry.bullets?.length ? (
            <View style={styles.bulletList}>
              {entry.bullets.map((bullet) => (
                <Text key={`${entry.id}-${bullet}`} style={styles.bullet}>
                  - {normalizePdfText(bullet)}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function PdfSectionBlock({
  config,
  title,
  entries,
  compact = false
}: {
  config: PdfTemplateConfig;
  title: string;
  entries: CvPdfEntry[];
  compact?: boolean;
}) {
  if (!entries.length) {
    return null;
  }

  const sectionDividerStyle = config.sections.topBorderColor
    ? {
        borderTopWidth: 1,
        borderTopColor: config.sections.topBorderColor,
        paddingTop: getDensityValue(config, 12, 13)
      }
    : {};

  return (
    <View
      style={[
        sectionDividerStyle,
        {
          marginTop: compact
            ? getDensityValue(config, 12, 13)
            : getDensityValue(config, 13, 15)
        }
      ]}
    >
      <View wrap={false}>
        <Text
          style={[
            styles.sectionTitle,
            {
              fontSize: config.sections.titleSize,
              letterSpacing: config.sections.titleLetterSpacing
            }
          ]}
        >
          {title}
        </Text>
        {entries.length ? (
          <View style={styles.entries}>
            <PdfEntryRow config={config} entry={entries[0]} />
          </View>
        ) : null}
      </View>
      {entries.length > 1 ? (
        <View style={styles.entries}>
          {entries.slice(1).map((entry) => (
            <PdfEntryRow key={entry.id} config={config} entry={entry} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function PdfCustomBlock({
  config,
  block
}: {
  config: PdfTemplateConfig;
  block: NonNullable<CvPdfData["customBlock"]>;
}) {
  if (!block.entries.length && !block.title) {
    return null;
  }

  return (
    <View
      style={{
        marginTop: getDensityValue(config, 13, 15)
      }}
    >
      {block.title ? (
        <Text
          style={[
            styles.sectionTitle,
            {
              fontSize: config.sections.titleSize,
              letterSpacing: config.sections.titleLetterSpacing
            }
          ]}
        >
          {normalizePdfText(block.title)}
        </Text>
      ) : null}
      <View style={styles.entries}>
        {block.entries.map((entry) => (
          <PdfEntryRow key={entry.id} config={config} entry={entry} />
        ))}
      </View>
    </View>
  );
}

export function PdfHeaderBlock({
  config,
  data
}: {
  config: PdfTemplateConfig;
  data: CvPdfData;
}) {
  const headerStyle = config.header.topBorderColor
    ? {
        borderTopWidth: 1,
        borderTopColor: config.header.topBorderColor,
        paddingTop: config.header.paddingTop ?? 0,
        paddingBottom: config.header.paddingBottom ?? 0
      }
    : {
        marginBottom: getDensityValue(config, 16, 18)
      };

  return (
    <View style={headerStyle}>
      {config.header.showKicker ? (
        <Text
          style={[
            styles.kicker,
            { letterSpacing: config.header.kickerLetterSpacing }
          ]}
        >
          Lebenslauf
        </Text>
      ) : null}
      {config.header.showName ? (
        <Text style={styles.fullName}>{data.identity.fullName}</Text>
      ) : null}
      {config.header.showSubtitle && data.identity.subtitle ? (
        <Text style={styles.subtitle}>{normalizePdfText(data.identity.subtitle)}</Text>
      ) : null}
    </View>
  );
}

export function PdfSidebarLayout({
  config,
  data
}: {
  config: PdfTemplateConfig;
  data: CvPdfData;
}) {
  const identityConfig = config.sidebar.identity;

  return (
    <View
      style={[
        styles.sidebar,
        {
          width: config.sidebarWidth,
          backgroundColor: config.sidebar.backgroundColor,
          paddingHorizontal: config.sidebar.paddingHorizontal,
          paddingTop: config.sidebar.paddingTop,
          paddingBottom: config.sidebar.paddingBottom
        }
      ]}
    >
      <View style={styles.sidebarInner}>
        <PdfPhotoBlock
          config={config}
          initials={data.identity.initials}
          photoUrl={data.identity.photoUrl}
          preparedPhotoSrc={data.identity.preparedPhotoSrc}
          photoPresentation={data.identity.photoPresentation}
        />

        {identityConfig?.show ? (
          <>
            <Text style={[styles.sidebarName, { fontSize: identityConfig.nameSize }]}>
              {data.identity.fullName}
            </Text>
            {data.identity.subtitle ? (
              <Text
                style={[
                  styles.sidebarSubtitle,
                  {
                    fontSize: identityConfig.subtitleSize,
                    marginBottom: identityConfig.subtitleMarginBottom
                  }
                ]}
              >
                {normalizePdfText(data.identity.subtitle)}
              </Text>
            ) : null}
          </>
        ) : null}

        <View style={[styles.sidebarStack, { gap: config.sidebar.blockGap }]}>
          {config.leftColumnSections.map((sectionKey) => {
            const section = getSidebarSectionItems(data, sectionKey);

            return (
              <PdfCompactSection
                key={sectionKey}
                config={config}
                title={section.title}
                items={section.items}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function PdfPageShell({
  config,
  data
}: {
  config: PdfTemplateConfig;
  data: CvPdfData;
}) {
  return (
    <Page
      size="A4"
      style={[styles.page, { backgroundColor: config.page.backgroundColor }]}
    >
      <View
        style={[
          styles.shell,
          {
            margin: config.shell.margin,
            borderRadius: config.shell.radius,
            backgroundColor: config.shell.backgroundColor,
            borderColor: config.shell.borderColor
          }
        ]}
      >
        <PdfSidebarLayout config={config} data={data} />

        <View
          style={{
            width: getMainColumnWidth(config.sidebarWidth),
            paddingHorizontal: config.main.paddingHorizontal,
            paddingTop: config.main.paddingTop,
            paddingBottom: config.main.paddingBottom
          }}
        >
          <PdfHeaderBlock config={config} data={data} />
          {(data.mainSectionOrder ??
            (config.rightColumnSections as CvPdfMainSectionOrderKey[])).map((sectionKey) => {
            if (sectionKey === "customBlock") {
              return data.customBlock ? (
                <PdfCustomBlock key={sectionKey} config={config} block={data.customBlock} />
              ) : null;
            }

            const section = getMainSectionEntries(data, sectionKey);

            return (
              <PdfSectionBlock
                key={sectionKey}
                config={config}
                title={section.title}
                entries={section.entries}
                compact={false}
              />
            );
          })}
        </View>
      </View>
    </Page>
  );
}

export function PdfTemplateDocument({
  data,
  config
}: {
  data: CvPdfData;
  config: PdfTemplateConfig;
}) {
  return (
    <Document author="MedMatch" title={`${data.identity.fullName} - ${config.templateTitle}`}>
      <PdfPageShell config={config} data={data} />
    </Document>
  );
}
