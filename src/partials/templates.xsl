<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

	<xsl:template name="layer-background">
		<div class="layer-background" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='background']/*">
				<b>
					<xsl:attribute name="class"><xsl:value-of select="@id" /></xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-collision">
		<div class="layer-collision" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='collision']/*">
				<b>
					<xsl:attribute name="class"><xsl:value-of select="@id" /></xsl:attribute>
					<xsl:attribute name="style">
						--x: <xsl:value-of select="@x" />px;
						--y: <xsl:value-of select="@y" />px;
						<xsl:if test="@w">--w: <xsl:value-of select="@w" />px;</xsl:if>
						<xsl:if test="@h">--h: <xsl:value-of select="@h" />px;</xsl:if>
					</xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-action">
		<div class="layer-action" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='action']/*">
				<b>
					<xsl:attribute name="class">a1</xsl:attribute>
					<xsl:attribute name="style">
						<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
						<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
						<xsl:if test="@w">--w: <xsl:value-of select="@w" />;</xsl:if>
						<xsl:if test="@h">--h: <xsl:value-of select="@h" />;</xsl:if>
					</xsl:attribute>
					<xsl:attribute name="data-action"><xsl:value-of select="@action" /></xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-los">
		<div class="layer-los">
			<!-- walls -->
			<div class="segment" style="--x: 42; --y: 42; --w: 268;"></div>
			<div class="segment" style="--x: 308; --y: 42; --h: 66;"></div>
			<div class="segment" style="--x: 308; --y: 106; --w: 258;"></div>
			<div class="segment" style="--x: 564; --y: 106; --h: 76;"></div>
			<div class="segment" style="--x: 308; --y: 180; --w: 258;"></div>
			<div class="segment" style="--x: 308; --y: 180; --h: 66;"></div>
			<div class="segment" style="--x: 42; --y: 244; --w: 268;"></div>
			<div class="segment" style="--x: 42; --y: 42; --h: 204;"></div>
			<!-- blocks -->
			<div class="block" style="--x: 50; --y: 66; --w: 60; --h: 44;"></div>
			<div class="block" style="--x: 50; --y: 112; --w: 28; --h: 64;"></div>
		</div>
	</xsl:template>

</xsl:stylesheet>